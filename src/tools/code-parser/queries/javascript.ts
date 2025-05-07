/*
JavaScript 查询：
- class definitions
- method definitions
- named function declarations
- arrow functions and function expressions assigned to variables
- object property function assignments
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
`
