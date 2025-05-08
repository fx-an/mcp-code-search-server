/*
TypeScript 查询：
- function signatures and declarations
- method signatures and definitions
- abstract method signatures
- class declarations (including abstract classes)
- module declarations
- interface declarations
- type declarations
- object property definitions and assignments
*/
export default `
; 函数声明
(function_declaration
  name: (identifier) @name.definition.function) @definition.function

; 方法定义
(method_definition
  name: (property_identifier) @name.definition.method) @definition.method

; 类声明
(class_declaration
  name: (identifier) @name.definition.class) @definition.class

; 接口声明
(interface_declaration
  name: (identifier) @name.definition.interface) @definition.interface

; 抽象类声明
(abstract_class_declaration
  name: (identifier) @name.definition.class) @definition.class

; 模块声明
(module
  name: (identifier) @name.definition.module) @definition.module

; 类型声明
(type_alias_declaration
  name: (identifier) @name.definition.type) @definition.type

; 单层成员表达式赋值函数
(expression_statement
  (assignment_expression
    left: (member_expression 
      object: (identifier)
      property: (property_identifier))
    right: [(function_expression) (arrow_function)])) @definition.member_function

; 双层成员表达式赋值函数
(expression_statement
  (assignment_expression
    left: (member_expression
      object: (member_expression))
    right: [(function_expression) (arrow_function)])) @definition.member_function

; 变量声明赋值函数
(variable_declaration
  (variable_declarator
    name: (identifier) @name.definition.function
    value: [(function_expression) (arrow_function)])) @definition.function

; 函数参数定义 - 常规函数
(formal_parameters
  (identifier) @name.definition.parameter) @definition.parameter

; 参数类型注解
(required_parameter
  name: (identifier) @name.definition.parameter) @definition.parameter

; 可选参数类型注解
(optional_parameter
  name: (identifier) @name.definition.parameter) @definition.parameter

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

; 接口属性声明
(property_signature
  name: (property_identifier) @name.definition.property) @definition.property

; 类属性声明
(public_field_definition
  name: (property_identifier) @name.definition.property) @definition.property

; 变量定义
(variable_declaration
  (variable_declarator
    name: (identifier) @name.definition.variable)) @definition.variable
`
