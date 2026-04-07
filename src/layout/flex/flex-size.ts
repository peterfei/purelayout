/**
 * Flex base size 和 hypothetical main size 计算 (修复测量逻辑)
 */
import type { FlexItemState, FlexContext } from './types.js';
import type { LayoutNode, LayoutOptions } from '../../types/layout.js';
import { resolveLength } from '../../css/cascade.js';
import { layoutBlockFormattingContext } from '../block/block-formatting.js';

/**
 * 确定所有 flex items 的 flex base size 和 hypothetical main size
 */
export function resolveFlexBaseSizes(items: FlexItemState[], ctx: FlexContext, options: LayoutOptions): void {
  for (const item of items) {
    if (item.flexBasis >= 0) {
      item.flexBaseSize = item.flexBasis;
    } else {
      const mainSizeDef = getMainSizeDefinite(item.node, ctx.isRow, ctx.containerMainSize, item.mainPaddingBorder);
      if (mainSizeDef >= 0) {
        item.flexBaseSize = mainSizeDef;
      } else {
        item.flexBaseSize = measureItemContentSize(item.node, ctx, options);
      }
    }

    item.flexBaseSize = Math.max(item.flexBaseSize, item.minMainSize);
    item.hypotheticalMainSize = Math.max(item.flexBaseSize, item.minMainSize);
    if (item.maxMainSize < Infinity) {
      item.hypotheticalMainSize = Math.min(item.hypotheticalMainSize, item.maxMainSize);
    }

    item.outerHypotheticalMainSize = item.hypotheticalMainSize + item.mainPaddingBorder
      + (item.mainAutoMarginStart ? 0 : item.mainMarginStart)
      + (item.mainAutoMarginEnd ? 0 : item.mainMarginEnd);

    item.targetMainSize = item.flexBaseSize;
  }
}

function getMainSizeDefinite(node: LayoutNode, isRow: boolean, containerMainSize: number, mainPaddingBorder: number): number {
  const bm = node.computedStyle.boxModel;
  const sizeValue = isRow ? bm.width : bm.height;
  let value = -1;
  if (sizeValue.type === 'length') value = sizeValue.value;
  else if (sizeValue.type === 'percentage') value = (sizeValue.value / 100) * containerMainSize;
  else return -1;
  if (bm.boxSizing === 'border-box') value = Math.max(0, value - mainPaddingBorder);
  return value;
}

/**
 * 测量 flex item 的内容尺寸
 * 关键修正：100% 统计 LineBoxes 宽度，防止文字容器坍塌
 */
function measureItemContentSize(node: LayoutNode, ctx: FlexContext, options: LayoutOptions): number {
  // 测量宽度应该是主轴可用空间（Row）或交叉轴可用空间（Column）
  let availableWidth = ctx.isRow 
    ? (ctx.containerMainSize === Infinity ? 1200 : ctx.containerMainSize) 
    : (ctx.containerCrossSize === 0 ? 1200 : ctx.containerCrossSize);
  
  if (availableWidth <= 0) availableWidth = options.containerWidth || 1200;

  const childContainingBlock = { width: availableWidth, height: undefined };

  // 临时布局以获取 content size
  node.contentRect.width = availableWidth;
  layoutBlockFormattingContext(node, childContainingBlock, options);

  if (ctx.isRow) {
    let maxW = 0;
    // 统计文字行宽度
    if (node.lineBoxes) {
      for (const lb of node.lineBoxes) maxW = Math.max(maxW, lb.width);
    }
    // 统计子块边界
    for (const child of node.children) {
      if (child.type !== 'text') {
        const end = child.contentRect.x + child.contentRect.width + child.boxModel.marginLeft + child.boxModel.marginRight;
        maxW = Math.max(maxW, end);
      }
    }
    return maxW;
  } else {
    // Column 布局，返回布局后的总高度
    return node.contentRect.height || 0;
  }
}
