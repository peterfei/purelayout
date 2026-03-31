/**
 * 布局引擎主入口
 */
import type { StyleNode, ComputedStyle } from '../types/style.js';
import type { LayoutNode, LayoutTree, LayoutOptions } from '../types/layout.js';
import type { ComputedBoxModel, BoundingClientRect } from '../types/box.js';
import { computeStyle, resolveLength } from '../css/cascade.js';
import { resolveWidth, resolveHorizontalMargins } from './resolver/width-resolver.js';
import { resolveHeight } from './resolver/height-resolver.js';
import { determineContainingBlock } from './containing-block.js';
import { layoutBlockFormattingContext } from './block/block-formatting.js';
import { establishesBFC } from './block/bfc.js';

let globalSourceIndex = 0;

function assignSourceIndex(): number {
  return globalSourceIndex++;
}

/**
 * 执行布局计算
 */
export function layout(root: StyleNode, options: LayoutOptions): LayoutTree {
  globalSourceIndex = 0;

  const rootLayout = buildLayoutTree(root, null, options);

  // 执行实际布局计算
  const containingBlock = {
    width: options.containerWidth,
    height: options.containerHeight,
  };
  layoutBlockFormattingContext(rootLayout, containingBlock, options);

  return { root: rootLayout, options };
}

/**
 * 递归构建布局树
 */
function buildLayoutTree(
  node: StyleNode,
  parentComputed: ComputedStyle | null,
  options: LayoutOptions,
): LayoutNode {
  const computedStyle = computeStyle(node, parentComputed, options.rootFontSize);
  const sourceIndex = assignSourceIndex();
  const isBlock = computedStyle.boxModel.display === 'block' || computedStyle.boxModel.display === 'inline-block';

  const layoutNode: LayoutNode = {
    sourceIndex,
    type: isBlock ? 'block' : 'inline',
    tagName: node.tagName,
    computedStyle,
    contentRect: { x: 0, y: 0, width: 0, height: 0 },
    boxModel: createEmptyBoxModel(),
    establishesBFC: establishesBFC(computedStyle),
    children: [],
  };

  // 递归构建子节点
  for (const child of node.children) {
    if (typeof child === 'string') {
      // 文本节点
      layoutNode.children.push({
        sourceIndex: assignSourceIndex(),
        type: 'text',
        tagName: '#text',
        computedStyle,
        contentRect: { x: 0, y: 0, width: 0, height: 0 },
        boxModel: createEmptyBoxModel(),
        establishesBFC: false,
        children: [],
        textContent: child,
      });
    } else {
      layoutNode.children.push(buildLayoutTree(child, computedStyle, options));
    }
  }

  return layoutNode;
}

function createEmptyBoxModel(): ComputedBoxModel {
  return {
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
    paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
    borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0,
  };
}

/**
 * 获取类似 DOM 的 getBoundingClientRect() 输出 (margin box)
 */
export function getBoundingClientRect(node: LayoutNode): BoundingClientRect {
  const { contentRect, boxModel } = node;
  const x = contentRect.x - boxModel.marginLeft;
  const y = contentRect.y - boxModel.marginTop;
  const width = contentRect.width + boxModel.marginLeft + boxModel.marginRight
    + boxModel.paddingLeft + boxModel.paddingRight
    + boxModel.borderLeft + boxModel.borderRight;
  const height = contentRect.height + boxModel.marginTop + boxModel.marginBottom
    + boxModel.paddingTop + boxModel.paddingBottom
    + boxModel.borderTop + boxModel.borderBottom;

  return { x, y, width, height, top: y, right: x + width, bottom: y + height, left: x };
}

/**
 * 按源索引查找节点
 */
export function findNodeBySourceIndex(root: LayoutNode, sourceIndex: number): LayoutNode | null {
  if (root.sourceIndex === sourceIndex) return root;
  for (const child of root.children) {
    const found = findNodeBySourceIndex(child, sourceIndex);
    if (found) return found;
  }
  return null;
}
