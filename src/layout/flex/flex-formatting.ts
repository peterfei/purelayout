/**
 * Flex Formatting Context (FFC) 布局 - 最终精度修复版本
 */
import type { LayoutNode, LayoutOptions } from '../../types/layout.js';
import type { ContainingBlock } from '../containing-block.js';
import type { FlexContext, FlexLine, FlexItemState } from './types.js';
import type { AlignItemsValue } from '../../types/style.js';
import { resolveWidth, resolveHorizontalMargins } from '../resolver/width-resolver.js';
import { resolveHeight } from '../resolver/height-resolver.js';
import { resolveLength } from '../../css/cascade.js';
import { collectFlexItems, sortFlexItemsByOrder } from './flex-item.js';
import { resolveFlexBaseSizes } from './flex-size.js';
import { resolveFlexibleLengths } from './flex-algorithm.js';
import { collectFlexLines } from './flex-wrap.js';
import { layoutBlockFormattingContext } from '../block/block-formatting.js';
import { layoutGridFormattingContext } from '../grid/grid-formatting.js';

export function layoutFlexFormattingContext(
  node: LayoutNode,
  containingBlock: ContainingBlock,
  options: LayoutOptions,
): void {
  console.log(`[FFC Debug] Layouting ${node.tagName} (ID: ${node.testId || 'N/A'})`);
  console.log(`  - Parent CB: W=${containingBlock.width}, H=${containingBlock.height}`);

  const style = node.computedStyle;
  const flex = style.flex;

  // 1. 解析容器尺寸
  const { width, paddingLeft, paddingRight, borderLeft, borderRight } =
    resolveWidth(style, containingBlock.width);

  const { marginLeft, marginRight } = resolveHorizontalMargins(
    style, containingBlock.width, width,
    paddingLeft, paddingRight, borderLeft, borderRight,
  );

  const marginTop = resolveLength(style.boxModel.marginTop, containingBlock.width);
  const marginBottom = resolveLength(style.boxModel.marginBottom, containingBlock.width);
  const borderTop = resolveLength(style.boxModel.borderTopWidth);
  const borderBottom = resolveLength(style.boxModel.borderBottomWidth);
  const paddingTop = resolveLength(style.boxModel.paddingTop, containingBlock.width);
  const paddingBottom = resolveLength(style.boxModel.paddingBottom, containingBlock.width);

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

  const isRow = flex.flexDirection === 'row' || flex.flexDirection === 'row-reverse';
  const isReverse = flex.flexDirection === 'row-reverse' || flex.flexDirection === 'column-reverse';
  const isWrap = flex.flexWrap === 'wrap' || flex.flexWrap === 'wrap-reverse';
  const isWrapReverse = flex.flexWrap === 'wrap-reverse';

  const heightValue = style.boxModel.height;
  const hasDefiniteHeight = heightValue.type === 'length';
  const definiteHeight = hasDefiniteHeight ? heightValue.value : 0;

  // 关键修正：容器主轴尺寸，如果高度是 auto (Column)，则应使用 containingBlock.height
  const containerMainSize = isRow 
    ? width 
    : (hasDefiniteHeight ? definiteHeight : (containingBlock.height || 0)); // Column 模式下，auto height 依赖 containingBlock.height
  
  // 关键修正：容器交叉轴尺寸
  const containerCrossSize = isRow 
    ? (hasDefiniteHeight ? definiteHeight : (containingBlock.height || 0)) // Row 模式下，auto cross size 依赖 containingBlock.height
    : width; // Column 模式下，交叉轴是 width

  console.log(`  - FFC Computed Container Sizes: Main=${containerMainSize}, Cross=${containerCrossSize}`);
  const gapMain = resolveGap(flex, isRow, true);
  const gapCross = resolveGap(flex, isRow, false);

  const ctx: FlexContext = {
    node, isRow, isReverse, isWrap, isWrapReverse,
    containerMainSize, containerCrossSize,
    gapMain, gapCross, lines: [],
    contentOriginX: 0, contentOriginY: 0,
  };

  const items = collectFlexItems(node, ctx);
  sortFlexItemsByOrder(items);

  resolveFlexBaseSizes(items, ctx, options);

  let lines = isWrap ? collectFlexLines(items, containerMainSize, gapMain) : [{ items, crossSize: 0, baseline: 0 }];

  performFlexLayoutPass(lines, ctx, flex);

  for (const item of items) {
    layoutFlexItemContent(item, ctx, options);
  }

  if (!isWrap || flex.alignContent !== 'stretch') {
    for (const line of lines) {
      let maxCS = 0;
      for (const item of line.items) {
        const outer = item.crossSize + item.crossPaddingBorder + item.crossMarginStart + item.crossMarginEnd;
        if (outer > maxCS) maxCS = outer;
      }
      line.crossSize = maxCS;
    }
  }

  let contentHeight: number;
  if (isRow) {
    contentHeight = lines.reduce((s, l) => s + l.crossSize, 0) + Math.max(0, lines.length - 1) * gapCross;
  } else {
    contentHeight = items.reduce((s, i) => s + i.mainSize + i.mainPaddingBorder + i.mainMarginStart + i.mainMarginEnd, 0) + Math.max(0, items.length - 1) * gapMain;
  }

  const { height } = resolveHeight(style, containingBlock.height, contentHeight);
  node.contentRect.height = height;

  ctx.containerCrossSize = isRow ? height : width;
  performFlexLayoutPass(lines, ctx, flex);
  applyAbsolutePositions(ctx);

  node.children = items.map(item => item.node);
}

function performFlexLayoutPass(lines: FlexLine[], ctx: FlexContext, flex: any) {
  for (const line of lines) {
    resolveFlexibleLengths(line.items, ctx.containerMainSize, ctx.gapMain);
    applyJustifyContent(line, ctx.containerMainSize, ctx.gapMain, flex.justifyContent);
    resolveCrossAxisForLine(line, flex.alignItems, ctx.isRow, ctx.containerCrossSize, lines.length === 1);
  }
  applyAlignContent(lines, ctx, flex.alignContent, flex.alignItems);
}

function resolveGap(flex: any, isRow: boolean, isMainAxis: boolean): number {
  const g = isMainAxis ? (isRow ? flex.columnGap : flex.rowGap) : (isRow ? flex.rowGap : flex.columnGap);
  return (g && g.type === 'length') ? g.value : 0;
}

function applyJustifyContent(line: FlexLine, containerMainSize: number, gapMain: number, justifyContent: string): void {
  const items = line.items;
  if (items.length === 0) return;
  const totalGap = (items.length - 1) * gapMain;
  let itemsUsedSize = 0;
  for (const item of items) itemsUsedSize += item.mainSize + item.mainPaddingBorder + item.mainMarginStart + item.mainMarginEnd;
  const freeSpace = (containerMainSize === Infinity) ? 0 : Math.max(0, containerMainSize - itemsUsedSize - totalGap);

  let pos = 0;
  let sp = gapMain;

  if (justifyContent === 'flex-end') pos = freeSpace;
  else if (justifyContent === 'center') pos = freeSpace / 2;
  else if (justifyContent === 'space-between') sp = items.length > 1 ? (freeSpace / (items.length - 1) + gapMain) : gapMain;
  else if (justifyContent === 'space-around') { const s = freeSpace / items.length; pos = s / 2; sp = s + gapMain; }
  else if (justifyContent === 'space-evenly') { const s = freeSpace / (items.length + 1); pos = s; sp = s + gapMain; }

  for (const item of items) {
    item.mainPos = pos + item.mainMarginStart;
    pos += item.mainSize + item.mainPaddingBorder + item.mainMarginStart + item.mainMarginEnd + sp;
  }
}

function resolveCrossAxisForLine(line: FlexLine, alignItems: AlignItemsValue, isRow: boolean, containerCrossSize: number, isSingleLine: boolean): void {
  let maxCS = 0;
  for (const item of line.items) {
    const cs = getItemDefiniteCrossSize(item, isRow, containerCrossSize);
    item.crossSize = Math.max(item.crossSize, cs);
    const outer = item.crossSize + item.crossPaddingBorder + item.crossMarginStart + item.crossMarginEnd;
    maxCS = Math.max(maxCS, outer);
  }
  line.crossSize = maxCS;
  if (isSingleLine && containerCrossSize > maxCS) maxCS = containerCrossSize;

  for (const item of line.items) {
    const align = item.node.computedStyle.flex.alignSelf !== 'auto' ? item.node.computedStyle.flex.alignSelf : alignItems;
    const outer = item.crossSize + item.crossPaddingBorder + item.crossMarginStart + item.crossMarginEnd;
    const extra = maxCS - outer;
    
    item.crossPos = item.crossMarginStart;
    if (align === 'flex-end') item.crossPos += extra;
    else if (align === 'center') item.crossPos += extra / 2;
    else if (align === 'stretch') {
      if (item.node.computedStyle.boxModel[isRow ? 'height' : 'width'].type === 'keyword') {
        item.crossSize = Math.max(item.crossSize, maxCS - item.crossPaddingBorder - item.crossMarginStart - item.crossMarginEnd);
      }
    }
  }
}

function getItemDefiniteCrossSize(item: FlexItemState, isRow: boolean, containerCrossSize: number): number {
  const bm = item.node.computedStyle.boxModel;
  const val = isRow ? bm.height : bm.width;
  if (val.type === 'length') return val.value;
  if (val.type === 'percentage') return (val.value / 100) * containerCrossSize;
  
  // 关键修正：如果交叉轴是 auto 且对齐方式是 stretch，继承容器可用宽度
  if (containerCrossSize > 0) {
     const align = item.node.computedStyle.flex.alignSelf !== 'auto' ? item.node.computedStyle.flex.alignSelf : 'stretch';
     if (align === 'stretch') return Math.max(0, containerCrossSize - item.crossPaddingBorder - item.crossMarginStart - item.crossMarginEnd);
  }
  return 0;
}

function applyAlignContent(lines: FlexLine[], ctx: FlexContext, alignContent: string, alignItems: AlignItemsValue): void {
  if (lines.length <= 1 || ctx.containerCrossSize <= 0 || ctx.containerCrossSize === Infinity) return;
  const total = lines.reduce((s, l) => s + l.crossSize, 0) + (lines.length - 1) * ctx.gapCross;
  const free = Math.max(0, ctx.containerCrossSize - total);
  let offset = 0;
  if (alignContent === 'flex-end') offset = free;
  else if (alignContent === 'center') offset = free / 2;
  for (const line of lines) for (const item of line.items) item.crossPos += offset;
}

function layoutFlexItemContent(item: FlexItemState, ctx: FlexContext, options: LayoutOptions): void {
  const node = item.node;

  // 关键修正：物理宽度 = Row 模式下的 mainSize 或 Column 模式下的 crossSize (不应为 0)
  const widthForChild = ctx.isRow ? item.mainSize : (item.crossSize || ctx.containerCrossSize);
  const heightForChild = ctx.isRow ? (item.crossSize || ctx.containerCrossSize) : item.mainSize;

  const childCB: ContainingBlock = { width: widthForChild, height: heightForChild || undefined };
  if (node.type === 'flex') layoutFlexFormattingContext(node, childCB, options);
  else if (node.type === 'grid') layoutGridFormattingContext(node, childCB, options);
  else layoutBlockFormattingContext(node, childCB, options);

  // 回填撑开的尺寸
  if (node.computedStyle.boxModel[ctx.isRow ? 'height' : 'width'].type === 'keyword') {
    if (ctx.isRow) item.crossSize = Math.max(item.crossSize, node.contentRect.height);
    else item.mainSize = Math.max(item.mainSize, node.contentRect.height);
  }
}

function applyAbsolutePositions(ctx: FlexContext): void {
  const { isRow, isReverse, isWrapReverse, lines, gapCross, containerMainSize } = ctx;
  let crossOffset = 0;
  for (const line of lines) {
    for (const item of line.items) {
      let mPos = item.mainPos;
      if (isReverse) mPos = containerMainSize - mPos - item.mainSize - item.mainPaddingBorder;
      const cPos = item.crossPos + crossOffset;
      const bm = item.node.computedStyle.boxModel;
      const pL = resolveLength(bm.paddingLeft), pT = resolveLength(bm.paddingTop);
      const bL = resolveLength(bm.borderLeftWidth), bT = resolveLength(bm.borderTopWidth);

      if (isRow) {
        item.node.contentRect.x = mPos + pL + bL;
        item.node.contentRect.y = cPos + pT + bT;
        item.node.contentRect.width = item.mainSize;
        item.node.contentRect.height = item.crossSize;
      } else {
        item.node.contentRect.x = cPos + pL + bL;
        item.node.contentRect.y = mPos + pT + bT;
        item.node.contentRect.width = item.crossSize;
        item.node.contentRect.height = item.mainSize;
      }
    }
    crossOffset += line.crossSize + gapCross;
  }
}
