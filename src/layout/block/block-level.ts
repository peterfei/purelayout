/**
 * Block-level box 判断
 */
import type { LayoutNode } from '../../types/layout.js';

/**
 * 判断节点是否是 block-level
 */
export function isBlockLevel(node: LayoutNode): boolean {
  const display = node.computedStyle?.boxModel.display ?? 'inline';
  return display === 'block' || display === 'inline-block';
}

/**
 * 判断 display 值是否是 block-level
 */
export function isBlockLevelDisplay(display: string): boolean {
  return display === 'block' || display === 'inline-block';
}
