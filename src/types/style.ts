/**
 * 样式节点类型
 */
import type {
  CSSValue,
  CSSDimensionValue,
  CSSMarginValue,
  CSSEdges,
  CSSColor,
} from './css-values.js';

// ===== 显示与盒模型属性类型 =====

export type DisplayValue = 'block' | 'inline' | 'inline-block' | 'none';

export type OverflowValue = 'visible' | 'hidden' | 'scroll' | 'auto';

export type BoxSizingValue = 'content-box' | 'border-box';

export type WordBreakValue = 'normal' | 'break-all' | 'keep-all';

export type OverflowWrapValue = 'normal' | 'break-word' | 'anywhere';

export type WhiteSpaceValue = 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line';

export type TextAlignValue = 'left' | 'right' | 'center' | 'justify';

export type VerticalAlignValue = 'baseline' | 'top' | 'middle' | 'bottom';

// ===== 可继承的文本属性 =====

export interface InheritedStyle {
  fontFamily: string;
  fontSize: CSSValue;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  lineHeight: CSSValue;
  color: CSSColor;
  textAlign: TextAlignValue;
  whiteSpace: WhiteSpaceValue;
  wordBreak: WordBreakValue;
  overflowWrap: OverflowWrapValue;
  letterSpacing: CSSValue;
  wordSpacing: CSSValue;
  textIndent: CSSValue;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

// ===== 非继承的盒模型属性 =====

export interface BoxModelStyle {
  display: DisplayValue;
  overflow: OverflowValue;
  boxSizing: BoxSizingValue;
  width: CSSDimensionValue;
  height: CSSDimensionValue;
  minWidth: CSSDimensionValue;
  maxWidth: CSSDimensionValue;
  minHeight: CSSDimensionValue;
  maxHeight: CSSDimensionValue;
  marginTop: CSSMarginValue;
  marginRight: CSSMarginValue;
  marginBottom: CSSMarginValue;
  marginLeft: CSSMarginValue;
  paddingTop: CSSDimensionValue;
  paddingRight: CSSDimensionValue;
  paddingBottom: CSSDimensionValue;
  paddingLeft: CSSDimensionValue;
  borderTopWidth: CSSDimensionValue;
  borderRightWidth: CSSDimensionValue;
  borderBottomWidth: CSSDimensionValue;
  borderLeftWidth: CSSDimensionValue;
  verticalAlign: VerticalAlignValue;
}

// ===== 输入样式节点 =====

export interface StyleNode {
  tagName: string;
  style: Partial<BoxModelStyle & InheritedStyle>;
  children: (StyleNode | string)[];
}

// ===== 计算后样式 =====

export interface ComputedStyle {
  boxModel: Required<BoxModelStyle>;
  inherited: Required<InheritedStyle>;
}
