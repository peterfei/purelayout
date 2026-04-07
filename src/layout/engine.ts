/**
 * 布局引擎主入口 (修复绝对坐标转换逻辑)
 */
import type { StyleNode, ComputedStyle } from '../types/style.js';
import type { LayoutNode, LayoutTree, LayoutOptions } from '../types/layout.js';
import type { ComputedBoxModel, BoundingClientRect } from '../types/box.js';
import { computeStyle, resolveLength } from '../css/cascade.js';
import { determineContainingBlock } from './containing-block.js';
import { layoutBlockFormattingContext } from './block/block-formatting.js';
import { layoutFlexFormattingContext } from './flex/flex-formatting.js';
import { layoutGridFormattingContext } from './grid/grid-formatting.js';
import { establishesBFC } from './block/bfc.js';
import { canCollapseParentChildMarginTop } from './block/margin-collapse.js';

let globalSourceIndex = 0;
function assignSourceIndex(): number { return globalSourceIndex++; }

/**
 * 执行布局计算
 */
export function layout(root: StyleNode, options: LayoutOptions): LayoutTree {
  globalSourceIndex = 0;
  const rootLayout = buildLayoutTree(root, null, options);

  const containingBlock = { width: options.containerWidth, height: options.containerHeight };

  // 1. 根节点起始位置 (content box 相对于 border box)
  const bl = resolveLength(rootLayout.computedStyle.boxModel.borderLeftWidth);
  const pl = resolveLength(rootLayout.computedStyle.boxModel.paddingLeft, options.containerWidth);
  const bt = resolveLength(rootLayout.computedStyle.boxModel.borderTopWidth);
  const pt = resolveLength(rootLayout.computedStyle.boxModel.paddingTop, options.containerWidth);

  rootLayout.contentRect.x = bl + pl;
  rootLayout.contentRect.y = bt + pt;

  // 2. 执行核心布局计算 (此时所有内部坐标均为相对坐标)
  if (rootLayout.type === 'grid') {
    layoutGridFormattingContext(rootLayout, containingBlock, options);
  } else if (rootLayout.type === 'flex') {
    layoutFlexFormattingContext(rootLayout, containingBlock, options);
  } else {
    layoutBlockFormattingContext(rootLayout, containingBlock, options);
  }

  // 3. 处理根节点边距折叠
  if (rootLayout.computedStyle && canCollapseParentChildMarginTop(rootLayout.computedStyle.boxModel)) {
    const collapsedMarginTop = rootLayout.collapsedMarginTop ?? 0;
    const initialMarginTop = resolveLength(rootLayout.computedStyle.boxModel.marginTop, options.containerWidth);
    if (collapsedMarginTop > initialMarginTop) {
      rootLayout.contentRect.y += (collapsedMarginTop - initialMarginTop);
    }
  }

  // 4. 后处理：递归将所有相对坐标转换为全局绝对坐标
  // 注意：LineBox 和 ContentRect 都要转换，且只能转换一次
  finalizeAbsolutePositions(rootLayout, rootLayout.contentRect.x, rootLayout.contentRect.y, options);

  return { root: rootLayout, options };
}

function finalizeAbsolutePositions(node: LayoutNode, absX: number, absY: number, options: LayoutOptions): void {
  // console.log(`Finalizing ${node.tagName} (${node.sourceIndex}) at abs(${absX}, ${absY})`);
  
  // 更新该节点的 LineBox 坐标 (它们是相对于该节点内容区顶点的)
  if (node.lineBoxes) {
    for (const lb of node.lineBoxes) {
      lb.y += absY;
      // console.log(`  LineBox at Y: ${lb.y}`);
      for (const frag of lb.fragments) {
        frag.x += absX;
        // console.log(`    Fragment "${frag.text}" at X: ${frag.x}`);
      }
    }
  }

  // 递归处理子节点
  for (const child of node.children) {
    // 检查子节点是否是绝对定位
    const isAbsolute = child.computedStyle.boxModel.position === 'absolute';
    let relX = child.contentRect.x;
    let relY = child.contentRect.y;

    if (isAbsolute) {
      // 如果是绝对定位，则 left/top 覆盖默认的流式布局坐标
      const left = child.computedStyle.boxModel.left;
      const top = child.computedStyle.boxModel.top;
      
      // 注意：目前简化处理，假设绝对定位是相对于父节点内容区左上角的
      if (left && left.type !== 'keyword') {
        relX = resolveLength(left, node.contentRect.width);
      }
      if (top && top.type !== 'keyword') {
        relY = resolveLength(top, node.contentRect.height);
      }

      // 核心修复：手动触发布局，因为绝对定位元素在父级的 BFC 循环中被跳过了
      const childContainingBlock = { width: node.contentRect.width, height: undefined };
      if (child.type === 'grid') {
        layoutGridFormattingContext(child, childContainingBlock, options);
      } else if (child.type === 'flex') {
        layoutFlexFormattingContext(child, childContainingBlock, options);
      } else if (child.type === 'block') {
        layoutBlockFormattingContext(child, childContainingBlock, options);
      }
    }

    const childAbsX = absX + relX;
    const childAbsY = absY + relY;
    
    child.contentRect.x = childAbsX;
    child.contentRect.y = childAbsY;
    
    finalizeAbsolutePositions(child, childAbsX, childAbsY, options);
  }
}

function buildLayoutTree(node: StyleNode, parentComputed: ComputedStyle | null, options: LayoutOptions): LayoutNode {
  const computedStyle = computeStyle(node, parentComputed, options.rootFontSize);
  const sourceIndex = assignSourceIndex();
  const display = computedStyle.boxModel.display;
  const isFlex = display === 'flex';
  const isGrid = display === 'grid';
  const isBlock = display === 'block' || display === 'inline-block' || isFlex || isGrid;

  const layoutNode: LayoutNode = {
    sourceIndex,
    type: isGrid ? 'grid' : (isFlex ? 'flex' : (isBlock ? 'block' : 'inline')),
    tagName: node.tagName,
    testId: node.style ? (node.style as Record<string, unknown>)['dataTestId'] as string | undefined : undefined,
    computedStyle,
    contentRect: { x: 0, y: 0, width: 0, height: 0 },
    boxModel: createEmptyBoxModel(),
    establishesBFC: establishesBFC(computedStyle),
    children: [],
  };

  for (const child of node.children) {
    if (typeof child === 'string') {
      layoutNode.children.push({
        sourceIndex: assignSourceIndex(), type: 'text', tagName: '#text', computedStyle,
        contentRect: { x: 0, y: 0, width: 0, height: 0 },
        boxModel: createEmptyBoxModel(), establishesBFC: false, children: [], textContent: child,
      });
    } else {
      layoutNode.children.push(buildLayoutTree(child, computedStyle, options));
    }
  }
  return layoutNode;
}

function createEmptyBoxModel(): ComputedBoxModel {
  return { marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0 };
}

export function getBoundingClientRect(node: LayoutNode): BoundingClientRect {
  const { contentRect, boxModel } = node;
  const x = contentRect.x - boxModel.paddingLeft - boxModel.borderLeft;
  const y = contentRect.y - boxModel.paddingTop - boxModel.borderTop;
  const width = contentRect.width + boxModel.paddingLeft + boxModel.paddingRight + boxModel.borderLeft + boxModel.borderRight;
  const height = contentRect.height + boxModel.paddingTop + boxModel.paddingBottom + boxModel.borderTop + boxModel.borderBottom;
  return { x, y, width, height, top: y, right: x + width, bottom: y + height, left: x };
}

export function findNodeBySourceIndex(root: LayoutNode, sourceIndex: number): LayoutNode | null {
  if (root.sourceIndex === sourceIndex) return root;
  for (const child of root.children) {
    const found = findNodeBySourceIndex(child, sourceIndex);
    if (found) return found;
  }
  return null;
}
