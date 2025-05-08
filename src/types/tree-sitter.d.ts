declare module 'tree-sitter' {
  export interface Point {
    row: number;
    column: number;
  }

  export interface SyntaxNode {
    type: string;
    text: string;
    startPosition: Point;
    endPosition: Point;
    startIndex: number;
    endIndex: number;
    namedChildCount: number;
    namedChild(index: number): SyntaxNode | null;
    firstChild: SyntaxNode | null;
  }

  export interface QueryCapture {
    name: string;
    node: SyntaxNode;
  }

  export interface Query {
    captures(node: SyntaxNode): QueryCapture[];
  }

  export class Query {
    constructor(language: any, queryString: string);
    captures(node: SyntaxNode): QueryCapture[];
  }

  export default class Parser {
    setLanguage(language: any): void;
    parse(input: string): { rootNode: SyntaxNode };
  }
} 