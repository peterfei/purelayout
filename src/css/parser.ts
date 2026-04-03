/**
 * CSS 值解析器
 *
 * 将 CSS 字符串值解析为 CSSValue 类型。
 */
import type {
  CSSValue,
  CSSLength,
  CSSPercentage,
  CSSKeyword,
  CSSCalc,
  CSSRelativeLength,
  CSSColor,
} from '../types/css-values.js';

const KEYWORDS = new Set([
  'auto', 'normal', 'none', 'inherit', 'initial', 'unset',
  'block', 'inline', 'inline-block', 'flex', 'grid',
  'visible', 'hidden', 'scroll',
  'content-box', 'border-box',
  'left', 'right', 'center', 'justify',
  'baseline', 'top', 'middle', 'bottom',
  'break-all', 'keep-all', 'break-word', 'anywhere',
  'nowrap', 'pre', 'pre-wrap', 'pre-line', 'wrap', 'wrap-reverse',
  'uppercase', 'lowercase', 'capitalize',
  'solid', 'dashed', 'dotted',
  'currentcolor',
  'row', 'row-reverse', 'column', 'column-reverse',
  'flex-start', 'flex-end', 'space-between', 'space-around', 'space-evenly',
  'stretch', 'start', 'end', 'dense',
]);

/**
 * 解析 CSS 字符串值为 CSSValue
 */
export function parseCSSValue(input: string): CSSValue {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    throw new Error(`Cannot parse empty CSS value`);
  }

  const lower = trimmed.toLowerCase();

  // 关键字
  if (KEYWORDS.has(lower)) {
    return { type: 'keyword', value: lower } as CSSKeyword;
  }

  // 颜色
  if (
    lower.startsWith('#') ||
    lower.startsWith('rgb(') ||
    lower.startsWith('rgba(') ||
    lower.startsWith('hsl(') ||
    lower.startsWith('hsla(')
  ) {
    return { type: 'color', value: trimmed } as CSSColor;
  }

  // calc()
  if (lower.startsWith('calc(') && lower.endsWith(')')) {
    return { type: 'calc', expression: trimmed } as CSSCalc;
  }

  // 数值 + 单位
  const match = trimmed.match(/^([+-]?\d*\.?\d+)(px|em|rem|fr|%)$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    if (unit === 'px') return { type: 'length', value, unit: 'px' } as CSSLength;
    if (unit === 'fr') return { type: 'fr', value } as any; // Using any for now to avoid strictly typed CSSFlexibleLength export issues if any
    if (unit === '%') return { type: 'percentage', value } as CSSPercentage;
    if (unit === 'em') return { type: 'em', value } as CSSRelativeLength;
    if (unit === 'rem') return { type: 'rem', value } as CSSRelativeLength;
  }

  // 纯数字（无单位，可能是 0）
  const numMatch = trimmed.match(/^([+-]?\d*\.?\d+)$/);
  if (numMatch) {
    return { type: 'length', value: parseFloat(numMatch[1]), unit: 'px' } as CSSLength;
  }

  throw new Error(`Cannot parse CSS value: "${input}"`);
}

/**
 * 解析 CSS 边值字符串 "10px" / "10px 20px" / "10px 20px 30px" / "10px 20px 30px 40px"
 */
export function parseEdgeValues(input: string): CSSValue[] {
  const parts = input.trim().split(/\s+/);
  return parts.map(parseCSSValue);
}

/**
 * 解析一个 CSS 值列表（逗号分隔）
 */
export function parseValueList(input: string): CSSValue[] {
  return input.split(',').map((s) => parseCSSValue(s.trim()));
}
