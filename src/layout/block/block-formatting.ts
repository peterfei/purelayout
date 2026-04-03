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
import { layoutFlexFormattingContext } from '../flex/flex-formatting.js';
import { layoutGridFormattingContext } from '../grid/grid-formatting.js';

/**
 * 布局一个 BFC
 */
export function layoutBlockFormattingContext(
  node: LayoutNode,
  containingBlock: ContainingBlock,
  options: LayoutOptions,
): void {
  // 1. 解析容器自身盒模型 (基于 parent containing block)
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

  const marginTop = resolveLength(node.computedStyle.boxModel.marginTop, containingBlock.width);
  const marginBottom = resolveLength(node.computedStyle.boxModel.marginBottom, containingBlock.width);
  const borderTop = resolveLength(node.computedStyle.boxModel.borderTopWidth);
  const borderBottom = resolveLength(node.computedStyle.boxModel.borderBottomWidth);
  const paddingTop = resolveLength(node.computedStyle.boxModel.paddingTop, containingBlock.width);
  const paddingBottom = resolveLength(node.computedStyle.boxModel.paddingBottom, containingBlock.width);

  // 设置 boxModel
  node.boxModel.marginTop = marginTop;
  node.boxModel.marginRight = marginRight;
  node.boxModel.marginBottom = marginBottom;
  node.boxModel.marginLeft = marginLeft;
  node.boxModel.paddingTop = paddingTop;
  node.boxModel.paddingRight = paddingRight;
  node.boxModel.paddingBottom = paddingBottom;
  node.boxModel.paddingLeft = paddingLeft;
  node.boxModel.borderTop = borderTop;
  node.boxModel.borderRight = borderRight;
  node.boxModel.borderBottom = borderBottom;
  node.boxModel.borderLeft = borderLeft;

  node.contentRect.width = width;

  // 初始化折叠 margin
  node.collapsedMarginTop = marginTop;
  node.collapsedMarginBottom = marginBottom;

  // 2. 布局子元素 (相对于当前节点的 content box，即起点为 0,0)
  const innerWidth = width; 
  const contentOriginX = 0; 
  const contentOriginY = 0;
  let currentY = contentOriginY;
  let pendingMarginTop = 0;
  let hasPrecedingContent = false;
  const childContainingBlock: ContainingBlock = { width: innerWidth, height: undefined };

  let inlineRun: LayoutNode[] = [];
  const whiteSpace = node.computedStyle?.inherited?.whiteSpace ?? 'normal';
  const preserveWhitespace = whiteSpace === 'pre' || whiteSpace === 'pre-wrap';

  for (const child of node.children) {
    if (child.type === 'text' && child.textContent?.trim() === '' && !preserveWhitespace) continue;

    if (isBlockLevel(child)) {
      // 处理之前的 inline 内容
      if (inlineRun.length > 0) {
        const inlineResult = layoutInlineRun(inlineRun, innerWidth, currentY, options, contentOriginX);
        currentY += inlineResult.totalHeight;
        inlineRun = [];
        hasPrecedingContent = true;
      }

      // 递归布局子元素
      if (child.type === 'flex') {
        layoutFlexFormattingContext(child, childContainingBlock, options);
      } else if (child.type === 'grid') {
        layoutGridFormattingContext(child, childContainingBlock, options);
      } else {
        layoutBlockFormattingContext(child, childContainingBlock, options);
      }

      const childMarginTop = child.boxModel.marginTop;
      const collapsedMargin = collapseMargins(pendingMarginTop, childMarginTop);

      // 如果这是第一个子元素，且父容器没有 padding/border，且父容器不建立 BFC，则 margin 会折叠到父容器
      const parentCollapsesTop = !hasPrecedingContent && paddingTop === 0 && borderTop === 0 && !node.establishesBFC;

      // 设置子元素位置 (相对于父节点 content box)
      child.contentRect.x = contentOriginX + child.boxModel.marginLeft + child.boxModel.borderLeft + child.boxModel.paddingLeft;

      const effectiveMarginTop = parentCollapsesTop ? 0 : collapsedMargin;
      child.contentRect.y = currentY + effectiveMarginTop + child.boxModel.borderTop + child.boxModel.paddingTop;

      if (parentCollapsesTop) {
        // 更新父节点的折叠 margin-top
        node.collapsedMarginTop = collapseMargins(node.collapsedMarginTop!, collapsedMargin);
      }

      const isSelfCollapsing = child.contentRect.height === 0
        && child.boxModel.paddingTop === 0 && child.boxModel.paddingBottom === 0
        && child.boxModel.borderTop === 0 && child.boxModel.borderBottom === 0
        && child.children.filter(c => c.type !== 'text' || (c.textContent?.trim() !== '')).length === 0;

      if (isSelfCollapsing) {
        pendingMarginTop = collapseMargins(collapsedMargin, child.boxModel.marginBottom);
        // 如果是自折叠且还在开头，继续影响父节点的 collapsedMarginTop
        if (parentCollapsesTop) {
          node.collapsedMarginTop = collapseMargins(node.collapsedMarginTop!, pendingMarginTop);
        }
      } else {
        currentY = child.contentRect.y + child.contentRect.height + child.boxModel.paddingBottom + child.boxModel.borderBottom;
        pendingMarginTop = child.boxModel.marginBottom;
        hasPrecedingContent = true;
      }
    } else {
      inlineRun.push(child);
    }
  }

  if (inlineRun.length > 0) {
    const inlineResult = layoutInlineRun(inlineRun, innerWidth, currentY, options, contentOriginX);
    currentY += inlineResult.totalHeight;
    hasPrecedingContent = true;
  }

  // 3. 解析高度
  const contentHeight = currentY - contentOriginY;
  const { height } = resolveHeight(node.computedStyle, containingBlock.height, contentHeight);
  node.contentRect.height = height;

  // 处理 margin-bottom 折叠
  const parentCollapsesBottom = paddingTop === 0 && borderTop === 0 && height === 0 && paddingBottom === 0 && borderBottom === 0;
  if (parentCollapsesBottom) {
    // 全折叠（空容器）：top 和 bottom 都通了
    node.collapsedMarginTop = collapseMargins(node.collapsedMarginTop!, pendingMarginTop);
    node.collapsedMarginBottom = node.collapsedMarginTop;
  } else if (paddingBottom === 0 && borderBottom === 0) {
    node.collapsedMarginBottom = collapseMargins(node.collapsedMarginBottom!, pendingMarginTop);
  }
}
