/**
 * 样式级联计算
 *
 * 将用户样式、UA 默认值、继承值合并为 ComputedStyle。
 */
import type { StyleNode, ComputedStyle, BoxModelStyle, InheritedStyle, FlexStyle, GridStyle, ComputedGridStyle } from '../types/style.js';
import type { CSSValue } from '../types/css-values.js';
import { INITIAL_BOX_MODEL, INITIAL_FLEX, INITIAL_GRID } from './initial.js';
import { getUADefaults } from './initial.js';
import { resolveInheritedStyle } from './inherit.js';
import { INHERITABLE_PROPERTIES } from './properties.js';
import { parseTrackList, parseSlashValues, parseCSSValue } from './parser.js';

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
  const userStyle = { ...node.style } as Record<string, unknown>;

  // 3.5 展开 shorthand 属性
  expandShorthands(userStyle);
  expandGridShorthands(userStyle);

  // 4. 解析相对值
  resolveRelativeValues(userStyle, parentFontSize, rootFontSize);

  // 5. 合并非继承属性：用户值 > UA 默认值 > 初始值
  const boxModel: Required<BoxModelStyle> = {
    ...INITIAL_BOX_MODEL,
    ...uaDefaults,
    ...userStyle,
  } as unknown as Required<BoxModelStyle>;

  // 6. 合并可继承属性：用户值 > 父元素继承值 > UA 默认值 > 初始值
  const inherited = resolveInheritedStyle(
    userStyle,
    parentComputed?.inherited ?? null,
    uaDefaults,
  );

  // 7. 合并 Flexbox 属性：用户值 > 初始值
  // gap shorthand 展开：gap → rowGap + columnGap
  let userGap = userStyle.gap as CSSValue | string | undefined;
  if (typeof userGap === 'string') userGap = parseCSSValue(userGap);

  const hasRowGap = 'rowGap' in userStyle;
  const hasColGap = 'columnGap' in userStyle;

  const flex: Required<FlexStyle> = {
    ...INITIAL_FLEX,
    ...userStyle,
  } as unknown as Required<FlexStyle>;

  // 如果设置了 gap 但没单独设置 rowGap/columnGap，则用 gap 值覆盖
  if (userGap && typeof userGap !== 'string' && userGap.type === 'length') {
    if (!hasRowGap) flex.rowGap = userGap;
    if (!hasColGap) flex.columnGap = userGap;
  }

  // 8. 合并 Grid 属性：用户值 > 初始值
  const grid: ComputedGridStyle = {
    ...INITIAL_GRID,
    ...userStyle,
  } as unknown as ComputedGridStyle;

  // 如果设置了 gap 但没单独设置 rowGap/columnGap，则用 gap 值覆盖 (针对 Grid)
  if (userGap && typeof userGap !== 'string' && userGap.type === 'length') {
    if (!('rowGap' in userStyle)) grid.rowGap = userGap;
    if (!('columnGap' in userStyle)) grid.columnGap = userGap;
  }

  // 解析模板字符串
  if (typeof userStyle.gridTemplateColumns === 'string') {
    grid.gridTemplateColumns = parseTrackList(userStyle.gridTemplateColumns);
  }
  if (typeof userStyle.gridTemplateRows === 'string') {
    grid.gridTemplateRows = parseTrackList(userStyle.gridTemplateRows);
  }

  // 解析线索引/名称 (如果用户传了字符串)
  if (typeof userStyle.gridColumnStart === 'string') grid.gridColumnStart = parseCSSValue(userStyle.gridColumnStart);
  if (typeof userStyle.gridColumnEnd === 'string') grid.gridColumnEnd = parseCSSValue(userStyle.gridColumnEnd);
  if (typeof userStyle.gridRowStart === 'string') grid.gridRowStart = parseCSSValue(userStyle.gridRowStart);
  if (typeof userStyle.gridRowEnd === 'string') grid.gridRowEnd = parseCSSValue(userStyle.gridRowEnd);

  return { boxModel, inherited, flex, grid };
}

/**
 * 展开 Grid 相关的 shorthand 属性
 */
function expandGridShorthands(style: Record<string, unknown>): void {
  // grid-column: 1 / 3
  if (typeof style.gridColumn === 'string') {
    const parts = parseSlashValues(style.gridColumn);
    style.gridColumnStart = parts[0];
    if (parts[1]) style.gridColumnEnd = parts[1];
    delete style.gridColumn;
  }

  // grid-row: 1 / 2
  if (typeof style.gridRow === 'string') {
    const parts = parseSlashValues(style.gridRow);
    style.gridRowStart = parts[0];
    if (parts[1]) style.gridRowEnd = parts[1];
    delete style.gridRow;
  }
}

/**
 * 展开 shorthand 属性（padding, margin）
 */
function expandShorthands(style: Record<string, unknown>): void {
  // padding: px(20) → paddingTop/Right/Bottom/Left
  const padding = style.padding as CSSValue | undefined;
  if (padding && padding.type === 'length') {
    if (!('paddingTop' in style)) style.paddingTop = padding;
    if (!('paddingRight' in style)) style.paddingRight = padding;
    if (!('paddingBottom' in style)) style.paddingBottom = padding;
    if (!('paddingLeft' in style)) style.paddingLeft = padding;
    delete style.padding;
  }

  // margin: px(20) → marginTop/Right/Bottom/Left
  const margin = style.margin as CSSValue | undefined;
  if (margin && margin.type === 'length') {
    if (!('marginTop' in style)) style.marginTop = margin;
    if (!('marginRight' in style)) style.marginRight = margin;
    if (!('marginBottom' in style)) style.marginBottom = margin;
    if (!('marginLeft' in style)) style.marginLeft = margin;
    delete style.margin;
  }
}

/**
 * 从 CSSValue 解析出 px 数值
 */
export function resolveLength(value: CSSValue | number | undefined, fallback: number = 0): number {
  if (value === undefined || value === null) return fallback;
  // 直接的数字（像素值）
  if (typeof value === 'number') return value;
  // CSSValue 对象
  if (value.type === 'length' || value.type === 'integer') return value.value;
  if (value.type === 'percentage') return value.value / 100 * fallback;
  if (value.type === 'fr') return 0; // fr units are resolved by the layout engine
  if (value.type === 'em' || value.type === 'rem') {
    // 如果还是相对值说明没有 resolve，用 fallback
    return value.value * 16;
  }
  return fallback;
}
