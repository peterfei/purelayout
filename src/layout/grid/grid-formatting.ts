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
  // 对于行，MVP 暂不支持 fr 分配，仅支持固定高度或 auto
  const rowTracks = resolveTracks(gridStyle.gridTemplateRows, containingBlock.height || 0, rowGap);

  // 4. 放置算法 (Placement)
  // MVP: 仅支持显式网格索引(1-based) 和 跨度(span)，以及自动放置
  const colCount = colTracks.length || 1;
  const items: { node: LayoutNode; colStart: number; colEnd: number; rowStart: number; rowEnd: number }[] = [];
  
  let autoRow = 1;
  let autoCol = 1;

  // 过滤掉不参与布局的节点（如空文本节点、display: none）
  const childrenToLayout = node.children.filter(child => {
    if (child.type === 'text' && (!child.textContent || child.textContent.trim() === '')) return false;
    if (child.computedStyle?.boxModel.display === 'none') return false;
    return true;
  });

  for (const child of childrenToLayout) {
    const cs = child.computedStyle.grid;
    
    // 确定列范围
    let cStart = getGridLine(cs.gridColumnStart, autoCol);
    let cEnd = getGridLine(cs.gridColumnEnd, cStart + 1);
    
    // 确定行范围
    let rStart = getGridLine(cs.gridRowStart, autoRow);
    let rEnd = getGridLine(cs.gridRowEnd, rStart + 1);

    // 跨度处理 (MVP: 仅处理整数差值)
    const colSpan = Math.max(1, cEnd - cStart);
    const rowSpan = Math.max(1, rEnd - rStart);

    items.push({ node: child, colStart: cStart, colEnd: cEnd, rowStart: rStart, rowEnd: rEnd });

    // 简单的自动放置步进 (MVP)
    autoCol += colSpan;
    if (autoCol > colCount) {
      autoCol = 1;
      autoRow += rowSpan;
    }
  }

  // 5. 执行子项布局
  const maxRow = Math.max(rowTracks.length, ...items.map(i => i.rowEnd - 1));
  while (rowTracks.length < maxRow) {
    rowTracks.push(0); // 补全 auto row
  }

  for (const item of items) {
    const child = item.node;
    const colIdx = item.colStart - 1;
    const rowIdx = item.rowStart - 1;
    const colSpan = item.colEnd - item.colStart;

    // 计算 Cell 宽度 (跨列累加)
    let cellW = 0;
    for (let c = 0; c < colSpan; c++) {
      cellW += colTracks[colIdx + c] || 0;
      if (c > 0) cellW += colGap;
    }
    if (cellW === 0) cellW = width;

    const cellH = rowTracks[rowIdx] || 0;
    
    // Grid items 默认 stretch (如果高度是 auto)
    const childBoxStyle = child.computedStyle.boxModel;
    const isStretchH = childBoxStyle.height.type === 'keyword' && childBoxStyle.height.value === 'auto';

    const childCB: ContainingBlock = { 
      width: cellW, 
      height: (isStretchH && cellH > 0) ? cellH : (cellH || undefined) 
    };

    if (child.type === 'flex') {
      layoutFlexFormattingContext(child, childCB, options);
    } else if (child.type === 'grid') {
      layoutGridFormattingContext(child, childCB, options);
    } else {
      layoutBlockFormattingContext(child, childCB, options);
    }

    // 执行 stretch 对齐：如果子元素高度为 auto 且单元格高度固定，则拉伸
    if (isStretchH && cellH > 0) {
      const pT = resolveLength(child.computedStyle?.boxModel.paddingTop || 0, cellW);
      const pB = resolveLength(child.computedStyle?.boxModel.paddingBottom || 0, cellW);
      const bT = resolveLength(child.computedStyle?.boxModel.borderTopWidth || 0);
      const bB = resolveLength(child.computedStyle?.boxModel.borderBottomWidth || 0);
      child.contentRect.height = Math.max(child.contentRect.height, cellH - pT - pB - bT - bB);
    }

    // 自动高度修正
    if (rowTracks[rowIdx] < child.contentRect.height + resolveLength(child.computedStyle?.boxModel.marginTop || 0) + resolveLength(child.computedStyle?.boxModel.marginBottom || 0)) {
       rowTracks[rowIdx] = child.contentRect.height + resolveLength(child.computedStyle?.boxModel.marginTop || 0) + resolveLength(child.computedStyle?.boxModel.marginBottom || 0);
    }

    // 计算最终坐标 (偏移)
    let offsetX = 0;
    for (let c = 0; c < colIdx; c++) offsetX += (colTracks[c] || 0) + colGap;
    
    let offsetY = 0;
    for (let r = 0; r < rowIdx; r++) offsetY += (rowTracks[r] || 0) + rowGap;

    child.contentRect.x = offsetX + resolveLength(child.computedStyle?.boxModel.marginLeft || 0, cellW)
      + resolveLength(child.computedStyle?.boxModel.borderLeftWidth || 0)
      + resolveLength(child.computedStyle?.boxModel.paddingLeft || 0, cellW);
      
    child.contentRect.y = offsetY + resolveLength(child.computedStyle?.boxModel.marginTop || 0, cellW)
      + resolveLength(child.computedStyle?.boxModel.borderTopWidth || 0)
      + resolveLength(child.computedStyle?.boxModel.paddingTop || 0, cellW);
  }

  // 6. 容器高度
  const totalContentHeight = rowTracks.reduce((sum, h) => sum + h, 0) + Math.max(0, rowTracks.length - 1) * rowGap;
  const { height } = resolveHeight(style, containingBlock.height, totalContentHeight);
  node.contentRect.height = height;
}

function getGridLine(val: any, fallback: number): number {
  if (val && (val.type === 'integer' || val.type === 'length')) return val.value;
  return fallback;
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
