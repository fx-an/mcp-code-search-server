/*
JavaScript 查询：
- class definitions
- method definitions
- named function declarations
- arrow functions and function expressions assigned to variables
- object property function assignments
- object property assignments
*/
export default `
; 单层成员表达式赋值函数 (obj.prop = function(){})
(expression_statement
  (assignment_expression
    left: (member_expression 
      object: (identifier)
      property: (property_identifier))
    right: (function_expression))) @definition.member_function

; 双层成员表达式赋值函数 (obj.sub.prop = function(){})
(expression_statement
  (assignment_expression
    left: (member_expression
      object: (member_expression))
    right: (function_expression))) @definition.member_function

; 对象方法定义
(method_definition
  name: (property_identifier) @name.definition.method) @definition.method

; 类定义
(class_declaration
  name: (identifier) @name.definition.class) @definition.class

; 函数声明
(function_declaration
  name: (identifier) @name.definition.function) @definition.function

; 变量函数赋值
(variable_declaration
  (variable_declarator
    name: (identifier) @name.definition.function
    value: [(arrow_function) (function_expression)])) @definition.function

; 函数参数定义 - 常规函数
(formal_parameters
  (identifier) @name.definition.parameter) @definition.parameter

; 函数参数定义 - 箭头函数
(arrow_function
  parameters: (formal_parameters
    (identifier) @name.definition.parameter)) @definition.parameter

; 函数表达式参数定义
(function_expression
  parameters: (formal_parameters
    (identifier) @name.definition.parameter)) @definition.parameter

; 成员函数参数定义
(expression_statement
  (assignment_expression
    left: (member_expression)
    right: (function_expression
      parameters: (formal_parameters
        (identifier) @name.definition.parameter)))) @definition.parameter

; 对象属性定义 (在对象字面量中)
(pair
  key: (property_identifier) @name.definition.property
  value: [(object) (function_expression) (arrow_function) (string) (number) (true) (false) (null) (undefined) (array) (member_expression) (identifier)]) @definition.property

; 单层成员表达式赋值值 (obj.prop = value)
(expression_statement
  (assignment_expression
    left: (member_expression 
      object: (identifier)
      property: (property_identifier) @name.definition.property)
    right: [(object) (string) (number) (true) (false) (null) (undefined) (array) (member_expression) (identifier)])) @definition.property

; 多层成员表达式赋值 (obj.sub.prop = value)
(expression_statement
  (assignment_expression
    left: (member_expression
      object: (member_expression)
      property: (property_identifier) @name.definition.property)
    right: [(object) (string) (number) (true) (false) (null) (undefined) (array) (member_expression) (identifier)])) @definition.property

; 变量定义
(variable_declaration
  (variable_declarator
    name: (identifier) @name.definition.variable)) @definition.variable
`
