import { SearchResult, FileSearchResult } from "../../types/search-files.js";
import fs from "fs";
import Parser, { Query, SyntaxNode } from 'tree-sitter';
import { javaQuery, typescriptQuery, javascriptQuery, pythonQuery } from './queries/index.js';
import { getLanguage } from './language.js';

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
    
    // 添加调试日志
    console.log('=== Debug Info ===');
    console.log('File:', filePath);
    console.log('Total captures:', captures.length);
    
    const processedNodes = new Set<string>();
    
    for (const capture of captures) {
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
  
  // 将文件搜索结果转换为带定义的结果
  export const enrichSearchResultsWithDefinitions = async (
    searchResults: FileSearchResult[],
    searchQuery: string = ''
  ): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];
    const processedFiles = new Set<string>();
  
    // 准备搜索关键词，用于过滤结果
    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 0);
  
    for (const result of searchResults) {
      if (!processedFiles.has(result.filePath)) {
        const fileContent = await fs.promises.readFile(result.filePath, 'utf-8');
        const definitions = await findDefinitions(result.filePath, fileContent);
        processedFiles.add(result.filePath);
        
        // 根据搜索关键词过滤结果
        const filteredDefinitions = keywords.length > 0
          ? definitions.filter(def => {
              const matchText = def.match.toLowerCase();
              return keywords.some(keyword => matchText.includes(keyword));
            })
          : definitions;
        
        // 将过滤后的定义结果添加到结果中
        results.push(...filteredDefinitions);
      }
    }
  
    return results;
  };