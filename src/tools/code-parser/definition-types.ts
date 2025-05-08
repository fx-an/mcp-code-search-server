/**
 * 定义类型相关的工具函数和常量
 * 用于区分代码中的定义节点和调用节点
 */

// JavaScript/TypeScript的定义类型
export const jstsDefinitionTypes = [
  'variable', 'function', 'class', 'method', 
  'interface', 'module', 'type', 'enum', 
  'field', 'member_function', 'property', 'parameter'
];

// Java的定义类型
export const javaDefinitionTypes = [
  'class', 'method', 'interface', 'enum',
  'constructor', 'field', 'annotation', 'property', 'parameter',
  'variable'
];

// Python的定义类型
export const pythonDefinitionTypes = [
  'class', 'function', 'method', 'parameter',
  'variable', 'property'
];

// 所有支持的定义类型
export const allDefinitionTypes = [
  ...jstsDefinitionTypes,
  ...javaDefinitionTypes,
  ...pythonDefinitionTypes
];

/**
 * 判断给定的定义类型是否是定义节点而不是调用节点
 * @param definitionType 定义类型
 * @returns 如果是定义节点返回true，否则返回false
 */
export const isDefinitionNotCall = (definitionType: string | undefined): boolean => {
  if (!definitionType) return false;
  return allDefinitionTypes.includes(definitionType);
}; 