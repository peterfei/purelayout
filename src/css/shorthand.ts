/**
 * 简写属性展开
 */
import type { CSSValue } from '../types/css-values.js';
import type { CSSEdges } from '../types/css-values.js';

/**
 * 展开 1/2/3/4 值简写为四边值
 *
 * 1 值: top=right=bottom=left
 * 2 值: top=bottom, right=left
 * 3 值: top, right=left, bottom
 * 4 值: top, right, bottom, left
 */
export function expandEdgeShorthand<T extends CSSValue>(values: T[]): CSSEdges<T> {
  switch (values.length) {
    case 1:
      return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
    case 2:
      return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
    case 3:
      return { top: values[0], right: values[1], bottom: values[2], left: values[1] };
    case 4:
      return { top: values[0], right: values[1], bottom: values[2], left: values[3] };
    default:
      throw new Error(`Invalid edge shorthand: expected 1-4 values, got ${values.length}`);
  }
}

/**
 * 展开 flex 简写属性
 *
 * flex: <flex-grow> <flex-shrink>? || <flex-basis>
 */
export function expandFlexShorthand(value: CSSValue | string | number): {
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: CSSValue;
} {
  if (typeof value === 'number') {
    return { flexGrow: value, flexShrink: 1, flexBasis: { type: 'length', value: 0, unit: 'px' } };
  }

  if (typeof value !== 'string') {
    if (value.type === 'keyword' && value.value === 'none') {
      return { flexGrow: 0, flexShrink: 0, flexBasis: { type: 'keyword', value: 'auto' } };
    }
    if (value.type === 'keyword' && value.value === 'auto') {
      return { flexGrow: 1, flexShrink: 1, flexBasis: { type: 'keyword', value: 'auto' } };
    }
    return {};
  }

  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) {
    const val = parts[0];
    if (val === 'none') return { flexGrow: 0, flexShrink: 0, flexBasis: { type: 'keyword', value: 'auto' } };
    if (val === 'auto') return { flexGrow: 1, flexShrink: 1, flexBasis: { type: 'keyword', value: 'auto' } };
    if (val === 'initial') return { flexGrow: 0, flexShrink: 1, flexBasis: { type: 'keyword', value: 'auto' } };
    
    if (/^\d+$/.test(val)) {
      return { flexGrow: parseInt(val), flexShrink: 1, flexBasis: { type: 'length', value: 0, unit: 'px' } };
    }
  }

  // TODO: 更完善的 flex 简写解析
  return {};
}
