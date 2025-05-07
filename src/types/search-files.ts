import { CodeAnalysisResult } from "./code-parser.js";

export interface SearchResult {
  filePath: string;
  line: number;
  column: number;
  match: string;
  definitionType?: string;  // 定义类型：function, class, interface 等
  definitionCode: string;   // 完整的定义代码片段
  syntaxTree?: string;
  variableAnalysis?: CodeAnalysisResult;
}

export interface FileSearchResult {
  filePath: string;
  line: number;
  column: number;
  match: string;
}

export interface SearchOptions {
  query: string;
  cwd: string;
  filePattern?: string;
  excludePatterns?: string[];
  excludeDirs?: string[];
} 