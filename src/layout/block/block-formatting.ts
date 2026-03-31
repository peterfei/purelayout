/**
 * Block Formatting Context 布局
 */
import type { LayoutNode, LayoutOptions } from '../../types/layout.js';
import type { ContainingBlock } from '../containing-block.js';
import { resolveWidth, resolveHorizontalMargins } from '../resolver/width-resolver.js';
import { resolveHeight } from '../resolver/height-resolver.js';
import { collapseMargins } from './margin-collapse.js';
import { resolveLength } from '../../css/cascade.js';
import { isBlockLevel } from './block-level.js';
import { layoutInlineRun } from '../inline/inline-formatting.js';

/**
 * 布局一个 BFC
 */
export function layoutBlockFormattingContext(
  node: LayoutNode,
  containingBlock: ContainingBlock,
  options: LayoutOptions,
): void {
  // 1. 解析宽度
  const { width, paddingLeft, paddingRight, borderLeft, borderRight } =
    resolveWidth(node.computedStyle, containingBlock.width);

  const { marginLeft, marginRight } = resolveHorizontalMargins(
    node.computedStyle,
    containingBlock.width,
    width,
    paddingLeft,
    paddingRight,
    borderLeft,
    borderRight,
  );

  const marginTop = resolveLength(node.computedStyle.boxModel.marginTop);
  const marginBottom = resolveLength(node.computedStyle.boxModel.marginBottom);
  const borderTop = resolveLength(node.computedStyle.boxModel.borderTopWidth);
  const borderBottom = resolveLength(node.computedStyle.boxModel.borderBottomWidth);

  // 设置 boxModel
  node.boxModel.marginTop = marginTop;
  node.boxModel.marginRight = marginRight;
  node.boxModel.marginBottom = marginBottom;
  node.boxModel.marginLeft = marginLeft;
  node.boxModel.paddingTop = resolveLength(node.computedStyle.boxModel.paddingTop);
  node.boxModel.paddingRight = paddingRight;
  node.boxModel.paddingBottom = resolveLength(node.computedStyle.boxModel.paddingBottom);
  node.boxModel.paddingLeft = paddingLeft;
  node.boxModel.borderTop = borderTop;
  node.boxModel.borderRight = borderRight;
  node.boxModel.borderBottom = borderBottom;
  node.boxModel.borderLeft = borderLeft;

  // content width
  node.contentRect.width = width;

  // 2. 布局子元素
  const innerWidth = width; // content box width
  let currentY = 0;
  let pendingMarginTop = 0;
  let hasPrecedingContent = false;
  const childContainingBlock: ContainingBlock = { width: innerWidth, height: undefined };

  // 收集内联和块级子元素
  let inlineRun: LayoutNode[] = [];

  for (const child of node.children) {
    if (child.type === 'text' && child.textContent?.trim() === '') {
      // 空白文本节点，跳过
      continue;
    }

    if (isBlockLevel(child)) {
      // 先处理累积的 inline run
      if (inlineRun.length > 0) {
        const inlineResult = layoutInlineRun(inlineRun, innerWidth, currentY, options);
        currentY += inlineResult.totalHeight;
        inlineRun = [];
        hasPrecedingContent = true;
      }

      // Block-level child
      const childMarginTop = child.computedStyle ? resolveLength(child.computedStyle.boxModel.marginTop) : 0;

      // Margin collapse
      if (hasPrecedingContent) {
        pendingMarginTop = collapseMargins(pendingMarginTop, childMarginTop);
      } else {
        pendingMarginTop = childMarginTop;
      }

      // 递归布局
      layoutBlockFormattingContext(child, childContainingBlock, options);

      // 设置子元素位置
      child.contentRect.x = 0;
      child.contentRect.y = currentY + pendingMarginTop;

      // 推进 Y
      currentY = child.contentRect.y + child.contentRect.height
        + child.boxModel.paddingTop + child.boxModel.paddingBottom
        + child.boxModel.borderTop + child.boxModel.borderBottom;

      pendingMarginTop = child.boxModel.marginBottom;
      hasPrecedingContent = true;
    } else {
      // Inline-level or text: 收集到 inline run
      inlineRun.push(child);
    }
  }

  // 处理最后的 inline run
  if (inlineRun.length > 0) {
    const inlineResult = layoutInlineRun(inlineRun, innerWidth, currentY, options);
    currentY += inlineResult.totalHeight;
  }

  // 3. 解析高度
  const contentHeight = currentY;
  const { height, paddingTop, paddingBottom, borderTop: bt, borderBottom: bb } =
    resolveHeight(node.computedStyle, containingBlock.height, contentHeight);

  node.contentRect.height = height;
  node.boxModel.paddingTop = paddingTop;
  node.boxModel.paddingBottom = paddingBottom;
  node.boxModel.borderTop = bt;
  node.boxModel.borderBottom = bb;
}
