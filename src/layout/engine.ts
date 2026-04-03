/**
 * 布局引擎主入口
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

  // 根节点起始位置：其 content box 相对于其自身的 border box
  const bl = resolveLength(rootLayout.computedStyle.boxModel.borderLeftWidth);
  const pl = resolveLength(rootLayout.computedStyle.boxModel.paddingLeft, options.containerWidth);
  const bt = resolveLength(rootLayout.computedStyle.boxModel.borderTopWidth);
  const pt = resolveLength(rootLayout.computedStyle.boxModel.paddingTop, options.containerWidth);

  rootLayout.contentRect.x = bl + pl;
  rootLayout.contentRect.y = bt + pt;

  if (rootLayout.type === 'grid') {
    layoutGridFormattingContext(rootLayout, containingBlock, options);
  } else if (rootLayout.type === 'flex') {
    layoutFlexFormattingContext(rootLayout, containingBlock, options);
  } else {
    layoutBlockFormattingContext(rootLayout, containingBlock, options);
  }

  // 处理 parent-child margin-top collapse（对根节点）
  if (rootLayout.computedStyle && canCollapseParentChildMarginTop(rootLayout.computedStyle.boxModel)) {
    const collapsedMarginTop = rootLayout.collapsedMarginTop ?? 0;
    const initialMarginTop = resolveLength(rootLayout.computedStyle.boxModel.marginTop, options.containerWidth);
    
    // 如果折叠后的 margin 比初始值大，说明子元素的 margin 溢出了
    if (collapsedMarginTop > initialMarginTop) {
      rootLayout.contentRect.y += (collapsedMarginTop - initialMarginTop);
    }
  }

  // 后处理：将相对坐标转换为绝对坐标
  finalizeAbsolutePositions(rootLayout, rootLayout.contentRect.x, rootLayout.contentRect.y);

  return { root: rootLayout, options };
}

function finalizeAbsolutePositions(node: LayoutNode, absX: number, absY: number): void {
  for (const child of node.children) {
    const childAbsX = absX + child.contentRect.x;
    const childAbsY = absY + child.contentRect.y;
    child.contentRect.x = childAbsX;
    child.contentRect.y = childAbsY;
    finalizeAbsolutePositions(child, childAbsX, childAbsY);
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
    testId: (node.style as Record<string, unknown>)['dataTestId'] as string | undefined,
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

/**
 * 获取类似 DOM 的 getBoundingClientRect() 输出 (border box, 不含 margin)
 * 注意：由于 layout 已经计算了绝对坐标，这里直接返回。
 */
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
