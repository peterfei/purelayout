/**
 * PureLayout — Pure JS/TS CSS Layout Engine
 *
 * 不依赖浏览器 DOM 的 CSS Block + Inline 布局计算引擎。
 */

// 类型导出
export type {
  CSSValue,
  CSSLength,
  CSSPercentage,
  CSSKeyword,
  CSSCalc,
  CSSRelativeLength,
  CSSColor,
  CSSDimensionValue,
  CSSMarginValue,
  CSSEdges,
} from './types/css-values.js';

export type { Rect, ComputedBoxModel, BoundingClientRect } from './types/box.js';

export type {
  StyleNode,
  ComputedStyle,
  InheritedStyle,
  BoxModelStyle,
  DisplayValue,
  OverflowValue,
  BoxSizingValue,
  WordBreakValue,
  OverflowWrapValue,
  WhiteSpaceValue,
  TextAlignValue,
  VerticalAlignValue,
} from './types/style.js';

export type {
  LayoutNode,
  LayoutTree,
  LayoutOptions,
  LayoutNodeType,
  LineBox,
  LineFragment,
} from './types/layout.js';

export type {
  TextMeasurer,
  TextStyle,
  FontMetrics,
  TextSegment,
} from './types/text.js';

// 核心函数导出
export { layout, getBoundingClientRect, findNodeBySourceIndex } from './layout/engine.js';

// 文本测量器导出
export { FallbackMeasurer } from './text/fallback-measurer.js';
export { CanvasMeasurer } from './text/canvas-measurer.js';

// 工具函数导出
export { px, pct, em, rem, auto, normal, none } from './utils/format.js';
