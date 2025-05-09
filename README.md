# mcp-code-search-server
一个MCP Server，帮助LLM查找相关代码在文件中的位置，支持返回完整的函数定义。
An MCP Server, which helps the LLM find the location of relevant code within files and supports returning the complete function definitions.

## 项目简介

mcp-code-search-server 是一个基于 Model Context Protocol (MCP) 实现的服务器，专为大语言模型(LLM)提供代码搜索功能。它能够帮助LLM精准定位代码库中的标识符（如变量、函数、类等），并返回其完整定义，而不仅仅是引用位置。通过获取完整的代码定义及其上下文，有助于LLM更好地理解代码的内部逻辑、数据流和依赖关系。

## 主要功能

- **代码搜索**：使用 ripgrep 高效搜索代码库中的标识符
- **多语言支持**：支持JavaScript/TypeScript、Java和Python的代码解析
- **完整定义提取**：自动识别并提取变量、函数、类等完整定义
- **多编码支持**：自动检测并处理不同编码的文件（UTF-8, GBK, Big5等）
- **智能过滤**：提供默认配置排除常见的非代码目录和文件类型

## 安装方法

```bash
# 使用npm安装
npm install mcp-code-search-server

# 或使用pnpm安装
pnpm install mcp-code-search-server
```

## 使用方法

### 作为命令行工具使用

```bash
npx mcp-code-search-server
```

### 在调试模式下使用

```bash
# 构建项目
npm run build

# 运行调试器
npm run debug

# 或者一步执行
npm run build-debug
```

### 在LLM工具中集成

本服务器基于MCP协议，可以作为Server被调用。大语言模型可以通过stdio接口与服务器通信。

```javascript
{
  "mcp": {
    "servers": {
      "code-search": {
        "command": "npx",
        "args": [
            "-y",
            "mcp-code-search-server"
        ]
      }
    }
  }
}
```

## API参数说明

### search-files 工具

搜索代码标识符并返回其完整定义。

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| query | string | 是 | 要搜索的代码标识符（变量名、函数名、类名等） |
| cwd | string | 是 | 要搜索的目录路径 |
| filePattern | string | 否 | 用于筛选文件的glob模式（例如：'*.ts'） |
| excludePatterns | string[] | 否 | 要从搜索中排除的文件模式数组 |
| excludeDirs | string[] | 否 | 要从搜索中排除的目录数组 |

## 支持的语言

- JavaScript/TypeScript
- Java
- Python

