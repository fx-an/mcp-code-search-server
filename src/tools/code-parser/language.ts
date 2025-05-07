import { Language } from 'tree-sitter';
import ParserJava from 'tree-sitter-java';
import ParserTypescript from 'tree-sitter-typescript';
import ParserJavascript from 'tree-sitter-javascript';
import ParserPython from 'tree-sitter-python';

// 获取文件对应的 tree-sitter 语言解析器
export const getLanguage = async (filePath: string): Promise<Language> => {
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  
  switch (ext) {
    case '.java':
      return ParserJava as unknown as Language;
    case '.ts':
      return ParserTypescript.typescript as unknown as Language;
    case '.tsx':
      return ParserTypescript.tsx as unknown as Language;
    case '.js':
    case '.jsx':
      return ParserJavascript as unknown as Language;
    case '.py':
      return ParserPython as unknown as Language;
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}; 