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
  CSSFlexibleLength,
  CSSInteger,
  CSSColor,
} from '../types/css-values.js';

const KEYWORDS = new Set([
  'auto', 'normal', 'none', 'inherit', 'initial', 'unset',
  'block', 'inline', 'inline-block', 'flex', 'grid',
  'absolute', 'relative', 'fixed', 'static',
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
  'stretch', 'start', 'end', 'dense', 'span',
]);

/**
 * 解析带斜杠的 CSS 值列表（如 grid-column: 1 / 3）
 */
export function parseSlashValues(input: string): CSSValue[] {
  return input.split('/').map((s) => parseCSSValue(s.trim()));
}

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
    if (unit === 'fr') return { type: 'fr', value } as CSSFlexibleLength;
    if (unit === '%') return { type: 'percentage', value } as CSSPercentage;
    if (unit === 'em') return { type: 'em', value } as CSSRelativeLength;
    if (unit === 'rem') return { type: 'rem', value } as CSSRelativeLength;
  }

  // 纯数字（无单位，可能是 0 或裸 10，默认为 px）
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

/**
 * 解析 Grid 轨道列表，支持 repeat() 函数
 */
export function parseTrackList(input: string): CSSValue[] {
  const result: CSSValue[] = [];
  const tokens = tokenizeSpaceSeparated(input);

  for (const token of tokens) {
    if (token.startsWith('repeat(') && token.endsWith(')')) {
      const content = token.substring(7, token.length - 1);
      const commaIndex = content.indexOf(',');
      if (commaIndex === -1) {
        throw new Error(`Invalid repeat() function: "${token}"`);
      }
      const countPart = content.substring(0, commaIndex).trim();
      const sizePart = content.substring(commaIndex + 1).trim();
      const count = parseInt(countPart);
      if (isNaN(count)) {
        throw new Error(`Invalid repeat count: "${countPart}"`);
      }
      const sizes = parseTrackList(sizePart);
      for (let i = 0; i < count; i++) {
        result.push(...sizes);
      }
    } else {
      result.push(parseCSSValue(token));
    }
  }
  return result;
}

/**
 * 将字符串按空格拆分，但保留括号内的内容为一个整体
 */
function tokenizeSpaceSeparated(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ' ' && depth === 0) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}
