/**
 * Clearance 计算
 */
import type { LayoutNode } from '../../types/layout.js';

/**
 * 计算 clearance 值
 *
 * clearance 阻止 margin-top 与前面的 float margin-bottom 折叠。
 * Phase 1 中 float 未实现，此模块预留接口。
 */
export function computeClearance(
  _node: LayoutNode,
  _previousMarginBottom: number,
): number {
  // Phase 1: float 未实现，clearance 始终为 0
  return 0;
}
