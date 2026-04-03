/**
 * Grid Formatting Context (GFC) 布局
 */
import type { LayoutNode, LayoutOptions } from '../../types/layout.js';
import type { ContainingBlock } from '../containing-block.js';
import { resolveWidth, resolveHorizontalMargins } from '../resolver/width-resolver.js';
import { resolveHeight } from '../resolver/height-resolver.js';
import { resolveLength } from '../../css/cascade.js';
import { layoutBlockFormattingContext } from '../block/block-formatting.js';
import { layoutFlexFormattingContext } from '../flex/flex-formatting.js';

/**
 * 布局一个 Grid Formatting Context
 */
export function layoutGridFormattingContext(
  node: LayoutNode,
  containingBlock: ContainingBlock,
  options: LayoutOptions,
): void {
  const style = node.computedStyle;
  const gridStyle = style.grid;

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

  // 2. 解析 Gap
  const rowGap = resolveLength(gridStyle.rowGap, 0);
  const colGap = resolveLength(gridStyle.columnGap, 0);

  // 3. 解析轨道尺寸
  const colTracks = resolveTracks(gridStyle.gridTemplateColumns, width, colGap);
  // 对于行，如果没有固定高度，暂时不支持 fr 分配（因为基础逻辑是自适应内容高度）
  const rowTracks = resolveTracks(gridStyle.gridTemplateRows, containingBlock.height || 0, rowGap);

  // 4. 基础放置逻辑 (按顺序填充)
  const cols = colTracks.length || 1;
  const numItems = node.children.length;
  const rows = Math.ceil(numItems / cols);

  // 如果 rowTracks 不够，补全（按 gridAutoRows 逻辑，MVP 暂用 auto）
  while (rowTracks.length < rows) {
    rowTracks.push(0); // 占位，后面根据内容修正
  }
  
  for (let i = 0; i < numItems; i++) {
    const child = node.children[i];
    const colIdx = i % cols;
    const rowIdx = Math.floor(i / cols);

    const cellW = colTracks[colIdx] || width;
    const cellH = rowTracks[rowIdx] || 0;

    const childCB: ContainingBlock = { width: cellW, height: cellH || undefined };

    if (child.type === 'flex') {
      layoutFlexFormattingContext(child, childCB, options);
    } else if (child.type === 'grid') {
      layoutGridFormattingContext(child, childCB, options);
    } else {
      layoutBlockFormattingContext(child, childCB, options);
    }
    
    // 如果是 auto row，根据内容更新 rowTracks
    if (rowTracks[rowIdx] < child.contentRect.height + resolveLength(child.computedStyle?.boxModel.marginTop || 0) + resolveLength(child.computedStyle?.boxModel.marginBottom || 0)) {
       rowTracks[rowIdx] = child.contentRect.height + resolveLength(child.computedStyle?.boxModel.marginTop || 0) + resolveLength(child.computedStyle?.boxModel.marginBottom || 0);
    }

    let offsetX = 0;
    for (let c = 0; colIdx > c; c++) offsetX += colTracks[c] + colGap;
    
    let offsetY = 0;
    for (let r = 0; rowIdx > r; r++) offsetY += rowTracks[r] + rowGap;

    child.contentRect.x = offsetX + resolveLength(child.computedStyle?.boxModel.marginLeft || 0, cellW)
      + resolveLength(child.computedStyle?.boxModel.borderLeftWidth || 0)
      + resolveLength(child.computedStyle?.boxModel.paddingLeft || 0, cellW);
      
    child.contentRect.y = offsetY + resolveLength(child.computedStyle?.boxModel.marginTop || 0, cellW)
      + resolveLength(child.computedStyle?.boxModel.borderTopWidth || 0)
      + resolveLength(child.computedStyle?.boxModel.paddingTop || 0, cellW);
  }

  const totalContentHeight = rowTracks.reduce((sum, h) => sum + h, 0) + Math.max(0, rows - 1) * rowGap;
  const { height } = resolveHeight(style, containingBlock.height, totalContentHeight);
  node.contentRect.height = height;
}

/**
 * 解析轨道尺寸，处理固定长度、百分比和 fr 单位
 */
function resolveTracks(templates: any[], containerSize: number, gap: number): number[] {
  if (templates.length === 0) return [];

  const numGaps = Math.max(0, templates.length - 1);
  let remainingSpace = containerSize - (numGaps * gap);
  let totalFr = 0;
  const results = new Array(templates.length).fill(0);

  // 第一步：分配非 fr 空间
  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    if (t.type === 'fr') {
      totalFr += t.value;
    } else {
      const size = resolveLength(t, containerSize);
      results[i] = size;
      remainingSpace -= size;
    }
  }

  // 第二步：分配 fr 空间
  if (totalFr > 0 && remainingSpace > 0) {
    const frUnit = remainingSpace / totalFr;
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      if (t.type === 'fr') {
        results[i] = t.value * frUnit;
      }
    }
  }

  return results;
}
