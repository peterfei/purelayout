/**
 * 继承属性处理
 */
import type { InheritedStyle } from '../types/style.js';
import type { CSSValue } from '../types/css-values.js';
import { INITIAL_INHERITED } from './initial.js';
import { INHERITABLE_PROPERTIES } from './properties.js';

/**
 * 可继承的 CSS 属性名集合
 */
export { INHERITABLE_PROPERTIES };

/**
 * 检查属性是否可继承
 */
export function isInheritable(prop: string): boolean {
  return INHERITABLE_PROPERTIES.has(prop);
}

/**
 * 合并继承属性
 *
 * 优先级：用户值 > 父元素继承值 > UA 默认值 > 初始值
 */
export function resolveInheritedStyle(
  userStyle: Partial<InheritedStyle>,
  parentInherited: Required<InheritedStyle> | null,
  uaDefaults: Partial<InheritedStyle>,
): Required<InheritedStyle> {
  const result = { ...INITIAL_INHERITED };

  // 1. 应用 UA 默认值
  Object.assign(result, uaDefaults);

  // 2. 应用父元素继承值
  if (parentInherited) {
    for (const key of INHERITABLE_PROPERTIES) {
      if (!(key in result) || result[key as keyof InheritedStyle] === INITIAL_INHERITED[key as keyof InheritedStyle]) {
        (result as Record<string, unknown>)[key] = parentInherited[key as keyof InheritedStyle];
      }
    }
  }

  // 3. 应用用户值（最高优先级）
  Object.assign(result, userStyle);

  return result;
}
