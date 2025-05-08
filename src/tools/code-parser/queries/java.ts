/*
Java 查询：
- class declarations
- method declarations
- interface declarations
- enum declarations
- constructor declarations
- field declarations
- method parameters
- variable declarations
*/
export default `
(class_declaration
  name: (identifier) @name.definition.class) @definition.class

(method_declaration
  name: (identifier) @name.definition.method) @definition.method

(interface_declaration
  name: (identifier) @name.definition.interface) @definition.interface

(enum_declaration
  name: (identifier) @name.definition.enum) @definition.enum

(constructor_declaration
  name: (identifier) @name.definition.constructor) @definition.constructor

(field_declaration
  declarator: (variable_declarator
    name: (identifier) @name.definition.field)) @definition.field

(annotation_type_declaration
  name: (identifier) @name.definition.annotation) @definition.annotation

; 方法参数定义
(formal_parameter
  name: (identifier) @name.definition.parameter) @definition.parameter

; 变量声明
(local_variable_declaration
  declarator: (variable_declarator
    name: (identifier) @name.definition.variable)) @definition.variable

; 对象属性赋值
(assignment_expression
  left: (field_access
    field: (identifier) @name.definition.property)) @definition.property

; 初始化器中的属性赋值
(object_creation_expression
  arguments: (argument_list
    (field_access
      field: (identifier) @name.definition.property))) @definition.property
`
