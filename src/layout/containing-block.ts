/**
 * 包含块计算
 */
import type { ComputedStyle } from '../types/style.js';

export interface ContainingBlock {
  width: number;
  height: number | undefined;
}

/**
 * 确定元素的包含块
 *
 * Phase 1 仅支持 normal flow:
 * 包含块 = 父元素的 content box
 */
export function determineContainingBlock(
  parentContentWidth: number,
  parentContentHeight: number | undefined,
  _childStyle: ComputedStyle,
): ContainingBlock {
  return {
    width: parentContentWidth,
    height: parentContentHeight,
  };
}
