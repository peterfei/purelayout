/**
 * 便捷 CSS 值工厂函数
 */
import type { CSSLength, CSSPercentage, CSSKeyword, CSSRelativeLength } from '../types/css-values.js';

/** 创建 px 长度值 */
export function px(value: number): CSSLength {
  return { type: 'length', value, unit: 'px' };
}

/** 创建百分比值 */
export function pct(value: number): CSSPercentage {
  return { type: 'percentage', value };
}

/** 创建 em 值 */
export function em(value: number): CSSRelativeLength {
  return { type: 'em', value };
}

/** 创建 rem 值 */
export function rem(value: number): CSSRelativeLength {
  return { type: 'rem', value };
}

/** auto 关键字 */
export const auto: CSSKeyword = { type: 'keyword', value: 'auto' };

/** normal 关键字 */
export const normal: CSSKeyword = { type: 'keyword', value: 'normal' };

/** none 关键字 */
export const none: CSSKeyword = { type: 'keyword', value: 'none' };
