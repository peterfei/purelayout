/**
 * 高度解析
 */
import type { ComputedStyle } from '../../types/style.js';
import { resolveLength } from '../../css/cascade.js';

/**
 * 解析元素的高度
 */
export function resolveHeight(
  style: ComputedStyle,
  containingBlockHeight: number | undefined,
  contentHeight: number,
): { height: number; paddingTop: number; paddingBottom: number; borderTop: number; borderBottom: number } {
  const paddingTop = resolveLength(style.boxModel.paddingTop);
  const paddingBottom = resolveLength(style.boxModel.paddingBottom);
  const borderTop = resolveLength(style.boxModel.borderTopWidth);
  const borderBottom = resolveLength(style.boxModel.borderBottomWidth);

  let height: number;

  if (style.boxModel.height.type === 'keyword' && style.boxModel.height.value === 'auto') {
    // auto height: 由内容决定
    height = contentHeight;
  } else {
    height = resolveLength(style.boxModel.height, containingBlockHeight ?? 0);
  }

  // clamp to min/max
  const minHeight = style.boxModel.minHeight.type === 'keyword' && style.boxModel.minHeight.value === 'auto'
    ? 0
    : resolveLength(style.boxModel.minHeight, containingBlockHeight ?? 0);
  const maxHeight = style.boxModel.maxHeight.type === 'keyword' && style.boxModel.maxHeight.value === 'none'
    ? Infinity
    : resolveLength(style.boxModel.maxHeight, containingBlockHeight ?? 0);

  height = Math.max(minHeight, Math.min(height, maxHeight));

  // box-sizing: border-box
  if (style.boxModel.boxSizing === 'border-box') {
    height = Math.max(0, height - paddingTop - paddingBottom - borderTop - borderBottom);
  }

  return { height: Math.max(0, height), paddingTop, paddingBottom, borderTop, borderBottom };
}
