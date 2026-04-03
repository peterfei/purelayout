/**
 * CSS 值类型系统
 *
 * 所有 CSS 属性值通过这套类型表达，是整个引擎的基础类型层。
 */

/** 绝对长度值 (px) */
export interface CSSLength {
  type: 'length';
  value: number;
  unit: 'px';
}

/** 百分比值 */
export interface CSSPercentage {
  type: 'percentage';
  value: number;
}

/** 关键字值 (auto, normal, none, etc.) */
export interface CSSKeyword {
  type: 'keyword';
  value: string;
}

/** em/rem 相对值 */
export interface CSSRelativeLength {
  type: 'em' | 'rem';
  value: number;
}

/** 弹性系数 (fr) */
export interface CSSFlexibleLength {
  type: 'fr';
  value: number;
}

/** CSS calc() 表达式 */
export interface CSSCalc {
  type: 'calc';
  expression: string;
}

/** 颜色值 */
export interface CSSColor {
  type: 'color';
  value: string;
}

/** 统一的 CSS 值联合类型 */
export type CSSValue =
  | CSSLength
  | CSSPercentage
  | CSSKeyword
  | CSSCalc
  | CSSRelativeLength
  | CSSFlexibleLength
  | CSSColor;

/** 允许 auto 的维度值 */
export type CSSDimensionValue = CSSLength | CSSPercentage | CSSKeyword;

/** 允许 auto 的 margin 值 */
export type CSSMarginValue = CSSLength | CSSPercentage | CSSKeyword;

/** 四边值 */
export interface CSSEdges<T> {
  top: T;
  right: T;
  bottom: T;
  left: T;
}
