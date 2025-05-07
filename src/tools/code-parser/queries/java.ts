/*
Java 查询：
- class declarations
- method declarations
- interface declarations
- enum declarations
- constructor declarations
- field declarations
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
`
