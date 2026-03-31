/**
 * 布局节点类型
 */
import type { ComputedStyle } from './style.js';
import type { Rect, ComputedBoxModel, BoundingClientRect } from './box.js';

// ===== Line Box 相关 =====

export interface LineFragment {
  nodeIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
  text?: string;
  ascent: number;
  descent: number;
}

export interface LineBox {
  y: number;
  height: number;
  baseline: number;
  width: number;
  fragments: LineFragment[];
}

// ===== 布局节点 =====

export type LayoutNodeType = 'block' | 'inline' | 'anonymous-block' | 'text';

export interface LayoutNode {
  sourceIndex: number;
  type: LayoutNodeType;
  tagName: string;
  computedStyle: ComputedStyle;
  contentRect: Rect;
  boxModel: ComputedBoxModel;
  establishesBFC: boolean;
  children: LayoutNode[];
  lineBoxes?: LineBox[];
  textContent?: string;
}

// ===== 布局树 =====

export interface LayoutTree {
  root: LayoutNode;
  options: LayoutOptions;
}

// ===== 布局选项 =====

export interface LayoutOptions {
  containerWidth: number;
  containerHeight?: number;
  textMeasurer: import('./text.js').TextMeasurer;
  rootFontSize?: number;
  debug?: boolean;
}

// Re-export
export type { BoundingClientRect } from './box.js';
