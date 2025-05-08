import { SearchResult, FileSearchResult } from "../../types/search-files.js";
import fs from "fs";
import Parser, { Query, SyntaxNode, QueryCapture } from 'tree-sitter';
import { javaQuery, typescriptQuery, javascriptQuery, pythonQuery } from './queries/index.js';
import { getLanguage } from './language.js';
import { isDefinitionNotCall } from './definition-types.js';

// 获取对应语言的查询
const getLanguageQuery = (filePath: string): string => {
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  switch (ext) {
    case '.java':
      return javaQuery;
    case '.ts':
    case '.tsx':
      return typescriptQuery;
    case '.js':
    case '.jsx':
      return javascriptQuery;
    case '.py':
      return pythonQuery;
    default:
      console.log('Unsupported file extension:', ext);
      return '';
  }
};

// 获取定义名称的通用方法
const findNameInChildren = (node: SyntaxNode, nameTypes: string[]): string => {
  for (let i = 0; i < node.namedChildCount; i++) {
    const child = node.namedChild(i);
    if (child && nameTypes.includes(child.type)) {
      return child.text;
    }
  }
  return '';
};

// 查找特定类型的子节点
const findChildOfType = (node: SyntaxNode, type: string): SyntaxNode | null => {
  for (let i = 0; i < node.namedChildCount; i++) {
    const child = node.namedChild(i);
    if (child && child.type === type) {
      return child;
    }
  }
  return null;
};

// 解析文件并查找定义
export const findDefinitions = async (filePath: string, fileContent: string): Promise<SearchResult[]> => {
    const language = await getLanguage(filePath);
    const parser = new Parser();
    parser.setLanguage(language);

    const tree = parser.parse(fileContent);
    const queryString = getLanguageQuery(filePath);
    const query = new Query(language, queryString);

    const results: SearchResult[] = [];
    const captures = query.captures(tree.rootNode);

    // 用于优先处理definition节点而非name.definition节点的映射
    const definitionCapturesByRange: Map<string, QueryCapture[]> = new Map();

    // 按位置分组捕获结果
    for (const capture of captures) {
      const range = `${capture.node.startPosition.row}-${capture.node.startPosition.column}`;
      if (!definitionCapturesByRange.has(range)) {
        definitionCapturesByRange.set(range, []);
      }
      definitionCapturesByRange.get(range)!.push(capture);
    }

    const processedNodes = new Set<string>();

    // 对所有捕获进行处理
    for (const capturesAtRange of definitionCapturesByRange.values()) {
      // 优先处理definition.类型的捕获，如果没有再处理name.definition.类型的捕获
      const definitionCapture = capturesAtRange.find(c => c.name.startsWith('definition.'));
      const capture = definitionCapture || capturesAtRange.find(c => c.name.startsWith('name.definition.'));

      if (!capture) continue;

      // 防止重复处理同一个节点
      const nodeKey = `${capture.node.startIndex}-${capture.node.endIndex}`;
      if (processedNodes.has(nodeKey)) continue;
      processedNodes.add(nodeKey);

      const node = capture.node;
      let definitionType = '';
      let definitionName = '';

      // 处理不同类型的捕获
      if (capture.name.startsWith('name.definition.')) {
        // 直接捕获到名称节点的情况
        definitionType = capture.name.replace('name.definition.', '');
        definitionName = node.text;
      } else if (capture.name.startsWith('definition.')) {
        // 捕获到定义节点的情况
        definitionType = capture.name.replace('definition.', '');

        // 成员函数定义的情况
        if (definitionType === 'member_function') {
          // 获取赋值表达式的左侧
          const assignExpr = findChildOfType(node, 'assignment_expression');
          if (assignExpr) {
            const leftExpr = assignExpr.firstChild;
            if (leftExpr && leftExpr.type === 'member_expression') {
              definitionName = leftExpr.text;
            }
          }
        } else {
          // 其他定义类型
          definitionName = findNameInChildren(node, [
            'identifier', 'property_identifier', 'type_identifier'
          ]);
        }
      }

      // 跳过没有找到名称或者类型的定义
      if (!definitionName || !definitionType) {
        continue;
      }

      // 获取完整的定义代码
      const definitionCode = fileContent.substring(node.startIndex, node.endIndex);

      // 最终结果
      results.push({
        filePath,
        line: node.startPosition.row + 1,
        column: node.startPosition.column + 1,
        match: definitionName,
        definitionType,
        definitionCode
      });
    }

    return results;
  };

  // 将文件搜索结果转换为带定义的结果
  export const enrichSearchResultsWithDefinitions = async (
    searchResults: FileSearchResult[],
    searchQuery: string = ''
  ): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];
    const processedFiles = new Set<string>();

    // 准备搜索关键词，用于精确匹配
    const exactSearchTerm = searchQuery.trim();

    for (const result of searchResults) {
      if (!processedFiles.has(result.filePath)) {
        const fileContent = await fs.promises.readFile(result.filePath, 'utf-8');
        const definitions = await findDefinitions(result.filePath, fileContent);
        processedFiles.add(result.filePath);

        // 精确匹配搜索词并且只包含定义而不是调用
        const exactMatches = definitions.filter(def => {
          // 确保是完全匹配而不是包含关系，并且是定义而不是调用
          return def.match === exactSearchTerm && isDefinitionNotCall(def.definitionType);
        });

        // 对于每个匹配的标识符，只保留代码最长的定义
        const uniqueMatches = new Map<string, SearchResult>();
        for (const match of exactMatches) {
          const key = `${match.filePath}-${match.match}`;
          if (!uniqueMatches.has(key) ||
              uniqueMatches.get(key)!.definitionCode.length < match.definitionCode.length) {
            uniqueMatches.set(key, match);
          }
        }

        // 将过滤后的定义结果添加到结果中
        results.push(...uniqueMatches.values());
      }
    }

    return results;
  };
