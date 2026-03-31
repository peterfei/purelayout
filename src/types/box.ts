/**
 * 几何基础类型
 */

/** 矩形 (content box) */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 计算后的盒模型值 (全部 resolved 为 px) */
export interface ComputedBoxModel {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  borderTop: number;
  borderRight: number;
  borderBottom: number;
  borderLeft: number;
}

/** 类似 DOM 的 getBoundingClientRect() 输出 (margin box) */
export interface BoundingClientRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}
