/**
 * BFC (Block Formatting Context) 创建判断
 */
import type { ComputedStyle } from '../../types/style.js';

/**
 * 判断元素是否建立新的 BFC
 */
export function establishesBFC(style: ComputedStyle): boolean {
  const display = style.boxModel.display as string;
  // display: inline-block, flex, grid 创建 BFC
  if (display === 'inline-block') return true;
  if (display === 'flex') return true;
  if (display === 'grid') return true;

  // overflow 不为 visible 创建 BFC
  if (style.boxModel.overflow !== 'visible') return true;

  return false;
}
