/*
Python 查询：
- class definitions
- function definitions
- method definitions
- lambda functions
- function parameters
- variable assignments
- attribute assignments
*/
export default `
(class_definition
  name: (identifier) @name.definition.class) @definition.class

(function_definition
  name: (identifier) @name.definition.function) @definition.function

(decorated_definition
  (function_definition
    name: (identifier) @name.definition.function)) @definition.function

(assignment
  left: (identifier) @name.definition.function
  right: (lambda)) @definition.function

(class_definition
  body: (block
    (function_definition
      name: (identifier) @name.definition.method))) @definition.method

; 函数参数定义
(function_definition
  parameters: (parameters
    (identifier) @name.definition.parameter)) @definition.parameter

; Lambda参数定义
(lambda
  parameters: (identifier) @name.definition.parameter) @definition.parameter

; 变量赋值
(assignment
  left: (identifier) @name.definition.variable) @definition.variable

; 属性赋值 (obj.attr = value)
(assignment
  left: (attribute
    attribute: (identifier) @name.definition.property)) @definition.property

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
`
