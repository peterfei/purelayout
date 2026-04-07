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

export type DisplayValue = 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none';

export type OverflowValue = 'visible' | 'hidden' | 'scroll' | 'auto';

export type BoxSizingValue = 'content-box' | 'border-box';

export type WordBreakValue = 'normal' | 'break-all' | 'keep-all';

export type OverflowWrapValue = 'normal' | 'break-word' | 'anywhere';

export type WhiteSpaceValue = 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line';

export type TextAlignValue = 'left' | 'right' | 'center' | 'justify';

export type VerticalAlignValue = 'baseline' | 'top' | 'middle' | 'bottom';

// ===== Flexbox 属性 =====

export type FlexDirectionValue = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type FlexWrapValue = 'nowrap' | 'wrap' | 'wrap-reverse';
export type JustifyContentValue = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItemsValue = 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
export type AlignContentValue = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch';
export type AlignSelfValue = 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';

export interface FlexStyle {
  flexDirection: FlexDirectionValue;
  flexWrap: FlexWrapValue;
  justifyContent: JustifyContentValue;
  alignItems: AlignItemsValue;
  alignContent: AlignContentValue;
  flexGrow: number;
  flexShrink: number;
  flexBasis: CSSDimensionValue;
  alignSelf: AlignSelfValue;
  order: number;
  gap: CSSDimensionValue;
  rowGap: CSSDimensionValue;
  columnGap: CSSDimensionValue;
}

// ===== Grid 属性 =====

export interface GridStyle {
  gridTemplateColumns: string | CSSValue[];
  gridTemplateRows: string | CSSValue[];
  gridAutoColumns: string | CSSValue[];
  gridAutoRows: string | CSSValue[];
  gridAutoFlow: 'row' | 'column' | 'row dense' | 'column dense';
  gridColumn?: string;
  gridRow?: string;
  gridColumnStart: string | CSSValue;
  gridColumnEnd: string | CSSValue;
  gridRowStart: string | CSSValue;
  gridRowEnd: string | CSSValue;
  justifyItems: 'stretch' | 'start' | 'end' | 'center';
  gap: CSSDimensionValue;
  rowGap: CSSDimensionValue;
  columnGap: CSSDimensionValue;
}

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
  backgroundColor: CSSColor;
  position: 'static' | 'relative' | 'absolute' | 'fixed';
  top: CSSDimensionValue;
  right: CSSDimensionValue;
  bottom: CSSDimensionValue;
  left: CSSDimensionValue;
}

// ===== 输入样式节点 =====

export interface StyleNode {
  tagName: string;
  style: Partial<BoxModelStyle & InheritedStyle & FlexStyle & GridStyle>;
  children: (StyleNode | string)[];
}

// ===== 计算后样式 =====

export interface ComputedGridStyle {
  gridTemplateColumns: CSSValue[];
  gridTemplateRows: CSSValue[];
  gridAutoColumns: CSSValue[];
  gridAutoRows: CSSValue[];
  gridAutoFlow: 'row' | 'column' | 'row dense' | 'column dense';
  gridColumnStart: CSSValue;
  gridColumnEnd: CSSValue;
  gridRowStart: CSSValue;
  gridRowEnd: CSSValue;
  justifyItems: 'stretch' | 'start' | 'end' | 'center';
  rowGap: CSSDimensionValue;
  columnGap: CSSDimensionValue;
}

export interface ComputedStyle {
  boxModel: Required<BoxModelStyle>;
  inherited: Required<InheritedStyle>;
  flex: Required<FlexStyle>;
  grid: ComputedGridStyle;
}
