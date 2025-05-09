import { SearchResult, FileSearchResult } from "../../types/search-files.js";
import fs from "fs";
import Parser, { Query, SyntaxNode, QueryCapture } from 'tree-sitter';
import { javaQuery, typescriptQuery, javascriptQuery, pythonQuery } from './queries/index.js';
import { getLanguage } from './language.js';
import { isDefinitionNotCall } from './definition-types.js';
import { readFileWithEncoding } from "../search-files.js";

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
      console.error('Unsupported file extension:', ext);
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
  try {
    // 检查文件内容中是否有编码问题
    if (fileContent.includes('')) {
      console.error(`文件 ${filePath} 包含编码问题，尝试转码...`);
    }
    
    // 确定文件类型，检查是否支持
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    if (!['.java', '.ts', '.tsx', '.js', '.jsx', '.py'].includes(ext)) {
      console.error(`不支持的文件类型: ${ext}，跳过文件: ${filePath}`);
      return [];
    }
    
    const language = await getLanguage(filePath);
    if (!language) {
      console.error(`未能加载语言支持: ${filePath}`);
      return [];
    }
    
    const parser = new Parser();
    parser.setLanguage(language);

    const tree = parser.parse(fileContent);
    const queryString = getLanguageQuery(filePath);
    
    // 确保有可用的查询字符串
    if (!queryString) {
      console.error(`未找到 ${filePath} 的语言查询，跳过文件`);
      return [];
    }
    
    let query: Query;
    try {
      query = new Query(language, queryString);
    } catch (error) {
      console.error(`创建查询失败: ${filePath}，错误: ${error}`);
      return [];
    }

    const results: SearchResult[] = [];
    
    let captures: QueryCapture[];
    try {
      captures = query.captures(tree.rootNode);
      console.error(`文件 ${filePath} 中找到 ${captures.length} 个捕获`);
    } catch (error) {
      console.error(`执行查询捕获失败: ${filePath}，错误: ${error}`);
      return [];
    }

    // 用于优先处理definition节点而非name.definition节点的映射
    const definitionCapturesByRange: Map<string, QueryCapture[]> = new Map();

    // 按位置分组捕获结果
    for (const capture of captures) {
      try {
        const range = `${capture.node.startPosition.row}-${capture.node.startPosition.column}`;
        if (!definitionCapturesByRange.has(range)) {
          definitionCapturesByRange.set(range, []);
        }
        definitionCapturesByRange.get(range)!.push(capture);
      } catch (error) {
        console.error(`处理捕获时出错: ${error}`);
        // 继续处理其他捕获
        continue;
      }
    }

    const processedNodes = new Set<string>();

    // 对所有捕获进行处理
    for (const capturesAtRange of definitionCapturesByRange.values()) {
      try {
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
        try {
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
        } catch (error) {
          console.error(`提取定义代码时出错: ${error}`);
          continue;
        }
      } catch (error) {
        console.error(`处理捕获范围时出错: ${error}`);
        continue;
      }
    }

    return results;
  } catch (error) {
    console.error(`解析文件 ${filePath} 时出错:`, error);
    return [];
  }
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
  console.error(`搜索关键词: '${exactSearchTerm}'`);

  for (const result of searchResults) {
    if (!processedFiles.has(result.filePath)) {
      try {
        console.error(`处理文件: ${result.filePath}`);
        // 使用自动编码检测读取文件
        const fileContent = await readFileWithEncoding(result.filePath);
        const definitions = await findDefinitions(result.filePath, fileContent);
        processedFiles.add(result.filePath);
        
        // 使用精确匹配：完全匹配搜索词并区分大小写
        const matchedDefinitions = definitions.filter(def => {
          // 如果搜索词为空，则返回所有定义
          if (!exactSearchTerm) return isDefinitionNotCall(def.definitionType);
          
          // 精确匹配：搜索词与定义名称完全相同，保留大小写敏感性
          const isMatched = def.match === exactSearchTerm;
          const isDefinition = isDefinitionNotCall(def.definitionType);
          
          // 匹配到时记录日志
          if (isMatched && isDefinition) {
            console.error(`匹配到定义: ${def.match}, 类型: ${def.definitionType}`);
          }
          
          return isMatched && isDefinition;
        });

        // 对于每个匹配的标识符，只保留代码最长的定义
        const uniqueMatches = new Map<string, SearchResult>();
        for (const match of matchedDefinitions) {
          const key = `${match.filePath}-${match.match}`;
          if (!uniqueMatches.has(key) ||
              uniqueMatches.get(key)!.definitionCode.length < match.definitionCode.length) {
            uniqueMatches.set(key, match);
          }
        }

        // 将过滤后的定义结果添加到结果中
        results.push(...uniqueMatches.values());
      } catch (error) {
        console.error(`处理文件 ${result.filePath} 时出错:`, error);
      }
    }
  }

  console.error(`最终结果数量: ${results.length}`);
  return results;
};
