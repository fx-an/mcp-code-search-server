import Parser from "tree-sitter";

export type SupportedExtensions = '.ts' | '.js' | '.tsx' | '.jsx' | '.py' | '.java';

export interface ParseResult {
  tree: Parser.Tree | null;
  error?: string;
}

export type VariableUsageType = 'definition' | 'reference' | 'unknown';

export interface VariableUsage {
  type: VariableUsageType;
  name: string;
  line: number;
  column: number;
  context: string;
}

export interface CodeAnalysisResult {
  usages: VariableUsage[];
  error?: string;
} 