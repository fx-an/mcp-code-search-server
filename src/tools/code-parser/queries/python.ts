/*
Python 查询：
- class definitions
- function definitions
- method definitions
- lambda functions
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
`
