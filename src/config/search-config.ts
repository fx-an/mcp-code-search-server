export const searchConfig = {
  // 默认要忽略的目录
  defaultExcludeDirs: [
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage",
    "tmp",
    "temp",
    "logs",
    ".vscode",
    ".idea",
    // Java相关
    "target",
    ".gradle",
    "out",
    // Python相关
    "__pycache__",
    "venv",
    ".pytest_cache",
    ".ipynb_checkpoints",
    "*.egg-info"
  ],
  
  // 默认要忽略的文件类型
  defaultExcludePatterns: [
    "*.log",
    "*.tmp",
    "*.temp",
    "*.bak",
    // Python相关
    "*.pyc",
    "*.pyo",
    // Java相关
    "*.class",
    "*.jar"
  ]
}; 