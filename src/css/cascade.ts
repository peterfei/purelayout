/**
 * 样式级联计算
 *
 * 将用户样式、UA 默认值、继承值合并为 ComputedStyle。
 */
import type { StyleNode, ComputedStyle, BoxModelStyle, InheritedStyle } from '../types/style.js';
import type { CSSValue } from '../types/css-values.js';
import { INITIAL_BOX_MODEL } from './initial.js';
import { getUADefaults } from './initial.js';
import { resolveInheritedStyle } from './inherit.js';
import { INHERITABLE_PROPERTIES } from './properties.js';

/**
 * 解析相对值为绝对值（em/rem）
 */
export function resolveRelativeValues(
  style: Partial<BoxModelStyle & InheritedStyle>,
  parentFontSize: number,
  rootFontSize: number,
): void {
  for (const key of Object.keys(style) as (keyof typeof style)[]) {
    const value = style[key] as CSSValue | number | undefined;
    if (value == null || typeof value === 'number') continue;
    if (value.type !== 'em' && value.type !== 'rem') continue;

    const referenceFontSize = value.type === 'rem' ? rootFontSize : parentFontSize;
    const resolved = value.value * referenceFontSize;
    (style as Record<string, unknown>)[key] = { type: 'length', value: resolved, unit: 'px' };
  }
}

/**
 * 计算节点的完整样式（ComputedStyle）
 */
export function computeStyle(
  node: StyleNode,
  parentComputed: ComputedStyle | null,
  rootFontSize: number = 16,
): ComputedStyle {
  // 1. 获取 UA 默认值
  const uaDefaults = getUADefaults(node.tagName);

  // 2. 确定父元素的 font-size（用于 em 计算）
  const parentFontSize = parentComputed
    ? resolveLength(parentComputed.inherited.fontSize, 16)
    : rootFontSize;

  // 3. 深拷贝用户样式以避免修改原始数据
  const userStyle = { ...node.style };

  // 4. 解析相对值
  resolveRelativeValues(userStyle, parentFontSize, rootFontSize);

  // 5. 合并非继承属性：用户值 > UA 默认值 > 初始值
  const boxModel: Required<BoxModelStyle> = {
    ...INITIAL_BOX_MODEL,
    ...uaDefaults,
    ...userStyle,
  } as Required<BoxModelStyle>;

  // 6. 合并可继承属性：用户值 > 父元素继承值 > UA 默认值 > 初始值
  const inherited = resolveInheritedStyle(
    userStyle,
    parentComputed?.inherited ?? null,
    uaDefaults,
  );

  return { boxModel, inherited };
}

/**
 * 从 CSSValue 解析出 px 数值
 */
export function resolveLength(value: CSSValue | undefined, fallback: number = 0): number {
  if (!value) return fallback;
  if (value.type === 'length') return value.value;
  if (value.type === 'percentage') return value.value / 100 * fallback;
  if (value.type === 'em' || value.type === 'rem') {
    // 如果还是相对值说明没有 resolve，用 fallback
    return value.value * 16;
  }
  return fallback;
}
