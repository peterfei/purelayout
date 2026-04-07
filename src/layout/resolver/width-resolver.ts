/**
 * 宽度解析
 */
import type { CSSValue } from '../../types/css-values.js';
import type { ComputedStyle } from '../../types/style.js';
import { resolveLength } from '../../css/cascade.js';

/**
 * 解析元素的宽度
 */
export function resolveWidth(
  style: ComputedStyle,
  containingBlockWidth: number,
): { width: number; paddingLeft: number; paddingRight: number; borderLeft: number; borderRight: number } {
  const paddingLeft = resolveLength(style.boxModel.paddingLeft, containingBlockWidth);
  const paddingRight = resolveLength(style.boxModel.paddingRight, containingBlockWidth);
  const borderLeft = resolveLength(style.boxModel.borderLeftWidth);
  const borderRight = resolveLength(style.boxModel.borderRightWidth);

  let width: number;

  if (style.boxModel.width.type === 'keyword' && style.boxModel.width.value === 'auto') {
    // auto width: 占满包含块（减去 padding 和 border）
    width = containingBlockWidth - paddingLeft - paddingRight - borderLeft - borderRight;
  } else {
    width = resolveLength(style.boxModel.width, containingBlockWidth);
  }

  // clamp to min/max
  const minWidth = style.boxModel.minWidth.type === 'keyword' && style.boxModel.minWidth.value === 'auto'
    ? 0
    : resolveLength(style.boxModel.minWidth, containingBlockWidth);
  const maxWidth = style.boxModel.maxWidth.type === 'keyword' && style.boxModel.maxWidth.value === 'none'
    ? Infinity
    : resolveLength(style.boxModel.maxWidth, containingBlockWidth);

  width = Math.max(minWidth, Math.min(width, maxWidth));

  // box-sizing: border-box
  if (style.boxModel.boxSizing === 'border-box') {
    const minBorderBoxWidth = paddingLeft + paddingRight + borderLeft + borderRight;
    // 如果指定的 border-box width 小于 padding+border，则拉伸
    width = Math.max(minBorderBoxWidth, width);
    // 计算实际 content width
    width = Math.max(0, width - paddingLeft - paddingRight - borderLeft - borderRight);
  }

  const finalWidth = Math.max(0, width);
  return { width: finalWidth, paddingLeft, paddingRight, borderLeft, borderRight };
}

/**
 * 解析水平 margin（auto 处理为 0，block-level 在 normal flow 中）
 */
export function resolveHorizontalMargins(
  style: ComputedStyle,
  containingBlockWidth: number,
  usedWidth: number,
  paddingLeft: number,
  paddingRight: number,
  borderLeft: number,
  borderRight: number,
): { marginLeft: number; marginRight: number } {
  const marginLeft = resolveLength(style.boxModel.marginLeft, containingBlockWidth);
  const marginRight = resolveLength(style.boxModel.marginRight, containingBlockWidth);

  // 如果 width 不是 auto，且 margin-left 和 margin-right 都是 auto，则平分剩余空间
  if (
    style.boxModel.width.type !== 'keyword' &&
    style.boxModel.marginLeft.type === 'keyword' && style.boxModel.marginLeft.value === 'auto' &&
    style.boxModel.marginRight.type === 'keyword' && style.boxModel.marginRight.value === 'auto'
  ) {
    const totalUsed = usedWidth + paddingLeft + paddingRight + borderLeft + borderRight;
    const remaining = containingBlockWidth - totalUsed;
    return { marginLeft: remaining / 2, marginRight: remaining / 2 };
  }

  return { marginLeft, marginRight };
}
