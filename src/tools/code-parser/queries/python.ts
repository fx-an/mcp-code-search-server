/*
Python 查询：
- class definitions
- function definitions
*/
export default `
; 类定义
(class_definition
  name: (identifier) @name.definition.class) @definition.class

; 函数定义
(function_definition
  name: (identifier) @name.definition.function) @definition.function

; 装饰器函数定义
(decorated_definition
  (function_definition
    name: (identifier) @name.definition.function)) @definition.function

; Lambda函数赋值
(assignment
  left: (identifier) @name.definition.function
  right: (lambda)) @definition.function

; 类方法定义
(class_definition
  body: (block
    (function_definition
      name: (identifier) @name.definition.method))) @definition.method

; 函数参数
(parameters
  (identifier) @name.definition.parameter) @definition.parameter

(default_parameter
  name: (identifier) @name.definition.parameter) @definition.parameter

; Lambda表达式 (整体捕获)
(lambda) @definition.lambda

; 变量赋值
(assignment
  left: (identifier) @name.definition.variable) @definition.variable

; 属性赋值
(attribute
  attribute: (identifier) @name.definition.property) @definition.property

; 类属性定义
(class_definition
  body: (block
    (expression_statement
      (assignment 
        left: (identifier) @name.definition.property)))) @definition.property

; 字典属性定义
(dictionary
  (pair
    key: (string) @name.definition.property)) @definition.property

; 列表推导式
(list_comprehension) @definition.list_comprehension

; 生成器表达式
(generator_expression) @definition.generator_expression

; 装饰器
(decorator) @definition.decorator

; 导入语句
(import_statement
  name: (dotted_name
    (identifier) @name.definition.import)) @definition.import

; 从导入语句
(import_from_statement
  module_name: (dotted_name
    (identifier) @name.definition.import_from)) @definition.import_from

; 异常处理
(try_statement) @definition.try_statement

; 上下文管理器
(with_statement) @definition.with_statement
`
