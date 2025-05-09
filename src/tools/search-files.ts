import child_process from "child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { rgPath } from "@vscode/ripgrep";
import readline from "readline";
import { searchConfig } from "../config/search-config.js";
import { enrichSearchResultsWithDefinitions } from "./code-parser/index.js";

// 文件搜索结果接口
interface FileSearchResult {
  filePath: string;
  line: number;
  column: number;
  match: string;
}

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
      const searchResults = await searchFiles(query, cwd, filePattern, excludePatterns, excludeDirs);
      const results = await enrichSearchResultsWithDefinitions(searchResults, query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );
};

export default searchFilesRegister;
