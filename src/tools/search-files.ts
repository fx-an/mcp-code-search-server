import child_process from "child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { rgPath } from "@vscode/ripgrep";
import readline from "readline";
import { searchConfig } from "../config/search-config.js";
import { enrichSearchResultsWithDefinitions } from "./code-parser/index.js";
import fs from "fs";
import jschardet from "jschardet";
import iconv from "iconv-lite";
import { SearchResult } from "../types/search-files.js";

// 文件搜索结果接口
interface FileSearchResult {
  filePath: string;
  line: number;
  column: number;
  match: string;
}

// 自动检测文件编码并读取文件内容
export const readFileWithEncoding = async (filePath: string): Promise<string> => {
  try {
    // 先读取文件的部分内容来检测编码
    const buffer = await fs.promises.readFile(filePath);
    
    // 使用jschardet检测编码
    const detected = jschardet.detect(buffer);
    const encoding = detected.encoding || 'utf-8';
    
    if (encoding.toLowerCase() !== 'utf-8' && encoding.toLowerCase() !== 'ascii') {
      console.error(`检测到文件 ${filePath} 编码为: ${encoding}, 置信度: ${detected.confidence}`);
      console.error(`尝试将文件 ${filePath} 从 ${encoding} 转换为 UTF-8`);
      
      // 定义编码映射，确保使用正确的编码名称
      const encodingMap: Record<string, string> = {
        'gb2312': 'gbk',  // GB2312通常使用GBK解码更好
        'gb18030': 'gbk', // GB18030也使用GBK
        'gbk': 'gbk',
        'big5': 'big5',
        'shift_jis': 'shift_jis',
        'euc-jp': 'euc-jp',
        'euc-kr': 'euc-kr',
        'iso-8859-1': 'iso-8859-1'
      };
      
      // 获取正确的编码名称
      const actualEncoding = encodingMap[encoding.toLowerCase()] || encoding;
      
      try {
        // 确保iconv-lite支持这个编码
        if (iconv.encodingExists(actualEncoding)) {
          return iconv.decode(buffer, actualEncoding);
        }
      } catch (error) {
        console.error(`转换编码 ${actualEncoding} 时出错:`, error);
      }
      
      // 如果指定编码失败，尝试常见的其他中文编码
      for (const tryEncoding of ['gbk', 'big5', 'gb18030']) {
        if (tryEncoding !== actualEncoding && iconv.encodingExists(tryEncoding)) {
          try {
            console.error(`尝试使用 ${tryEncoding} 解码`);
            const content = iconv.decode(buffer, tryEncoding);
            if (!content.includes('')) {
              console.error(`成功使用 ${tryEncoding} 解码`);
              return content;
            }
          } catch (e) {
            // 忽略错误，继续尝试其他编码
          }
        }
      }
    }
    
    // 默认使用UTF-8编码
    return buffer.toString('utf-8');
  } catch (error) {
    console.error(`读取文件 ${filePath} 时出错:`, error);
    // 出错时尝试使用UTF-8读取
    return fs.promises.readFile(filePath, 'utf-8');
  }
};

export const searchFiles = async (
  query: string,
  cwd: string,
  filePattern?: string,
  excludePatterns?: string[],
  excludeDirs?: string[]
): Promise<FileSearchResult[]> => {
  const args = ["--json", "-e", query];
  
  if (filePattern) {
    args.push("--glob", filePattern);
  }
  
  // 合并默认忽略的文件类型和用户指定的忽略文件类型
  [...searchConfig.defaultExcludePatterns, ...(excludePatterns || [])].forEach(pattern => {
    args.push("--glob", `!${pattern}`);
  });

  // 合并默认忽略目录和用户指定的忽略目录
  [...searchConfig.defaultExcludeDirs, ...(excludeDirs || [])].forEach(dir => {
    args.push("--glob", `!${dir}/**`);
  });

  // 添加搜索目录限制
  args.push(cwd);
  
  console.error(`执行ripgrep搜索: "${query}" 目录: ${cwd}`);
  
  const child = child_process.spawn(rgPath, args);
  const results: FileSearchResult[] = [];
  let currentResult: Partial<FileSearchResult> | null = null;

  return new Promise((resolve, reject) => {
    let errorOutput = "";

    readline.createInterface({
      input: child.stdout,
      output: process.stdout,
      terminal: false,
    }).on("line", (line) => {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === "match") {
          if (currentResult) {
            results.push(currentResult as FileSearchResult);
          }
          
          const filePath = parsed.data?.path?.text;
          const matchText = parsed.data?.lines?.text;
          
          if (!filePath || !matchText) {
            return;
          }

          currentResult = {
            filePath,
            line: parsed.data.line_number,
            column: parsed.data.submatches?.[0]?.start || 0,
            match: matchText.trim(),
          };
        }
      } catch (error) {
        console.error("Error parsing ripgrep output:", error);
      }
    }).on("close", () => {
      if (currentResult) {
        results.push(currentResult as FileSearchResult);
      }
      
      if (errorOutput) {
        reject(new Error(`ripgrep process error: ${errorOutput}`));
      } else {
        console.error(`搜索完成，共找到 ${results.length} 条结果`);
        resolve(results);
      }
    });

    child.stderr.on("data", (data) => {
      errorOutput += data;
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
};

const searchFilesRegister = (server: McpServer) => {
  server.tool(
    "search-files",
    "在指定目录中搜索代码标识符并返回其完整定义。此工具帮助查找变量、函数、类等定义的具体实现代码，而不仅是引用位置。通过获取完整的代码定义及其上下文，有助于理解代码的内部逻辑、数据流和依赖关系，从而更好地分析和解释代码功能。",
    {
      query: z.string().describe("要搜索的代码标识符（如变量名、函数名、类名等）"),
      cwd: z.string().describe("要搜索的目录路径。此目录将被递归搜索。"),
      filePattern: z.string().optional().describe("用于筛选文件的glob模式（例如：'*.ts'表示只搜索TypeScript文件）。如果不提供，将搜索所有文件。"),
      excludePatterns: z.array(z.string()).optional().describe("要从搜索中排除的文件模式数组。这些模式将与默认排除模式合并。"),
      excludeDirs: z.array(z.string()).optional().describe("要从搜索中排除的目录数组。这些目录将与默认排除目录合并。"),
    },
    async ({ query, cwd, filePattern, excludePatterns, excludeDirs }) => {
      try {
        const searchResults = await searchFiles(query, cwd, filePattern, excludePatterns, excludeDirs);
        
        if (searchResults.length === 0) {
          console.error(`搜索未找到任何结果`);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify([], null, 2),
              },
            ],
          };
        }
        
        let results: SearchResult[] = [];
        try {
          results = await enrichSearchResultsWithDefinitions(searchResults, query);
          
          // 如果没有找到精确匹配的结果，尝试进行简单的文本匹配并返回原始结果
          if (results.length === 0) {
            console.error(`未找到精确匹配的定义，返回原始搜索结果`);
            
            // 将原始搜索结果转换为可以返回的格式
            const simpleResults = searchResults.map(result => ({
              filePath: result.filePath,
              line: result.line,
              column: result.column,
              match: result.match,
              definitionType: 'unknown',
              definitionCode: result.match
            }));
            
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(simpleResults, null, 2),
                },
              ],
            };
          }
        } catch (error) {
          console.error(`处理搜索结果时出错:`, error);
          
          // 出错时返回原始搜索结果
          const simpleResults = searchResults.map(result => ({
            filePath: result.filePath,
            line: result.line,
            column: result.column,
            match: result.match,
            definitionType: 'unknown',
            definitionCode: result.match
          }));
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(simpleResults, null, 2),
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error(`执行搜索时出错:`, error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify([], null, 2),
            },
          ],
        };
      }
    }
  );
};

export default searchFilesRegister;
