/**
 * 百分比值解析辅助
 */
import type { CSSValue } from '../../types/css-values.js';

/**
 * 解析百分比值
 * @param value - CSS 值
 * @param reference - 参考值（100% 对应的值）
 */
export function resolvePercentage(value: CSSValue, reference: number): number {
  if (value.type === 'percentage') {
    return (value.value / 100) * reference;
  }
  if (value.type === 'length') {
    return value.value;
  }
  return 0;
}
