/**
 * UA 样式表 — 浏览器默认样式
 */
import type { BoxModelStyle, InheritedStyle, FlexStyle, GridStyle } from '../types/style.js';
import { px } from '../utils/format.js';

/** 属性初始值 */
export const INITIAL_BOX_MODEL: Required<BoxModelStyle> = {
  display: 'inline',
  overflow: 'visible',
  boxSizing: 'border-box', // Changed from 'content-box' to 'border-box'
  width: { type: 'keyword', value: 'auto' },
  height: { type: 'keyword', value: 'auto' },
  minWidth: px(0),
  maxWidth: { type: 'keyword', value: 'none' },
  minHeight: px(0),
  maxHeight: { type: 'keyword', value: 'none' },
  marginTop: px(0),
  marginRight: px(0),
  marginBottom: px(0),
  marginLeft: px(0),
  paddingTop: px(0),
  paddingRight: px(0),
  paddingBottom: px(0),
  paddingLeft: px(0),
  borderTopWidth: px(0),
  borderRightWidth: px(0),
  borderBottomWidth: px(0),
  borderLeftWidth: px(0),
  verticalAlign: 'baseline',
  backgroundColor: { type: 'color', value: 'transparent' },
  position: 'static',
  top: { type: 'keyword', value: 'auto' },
  right: { type: 'keyword', value: 'auto' },
  bottom: { type: 'keyword', value: 'auto' },
  left: { type: 'keyword', value: 'auto' },
};

export const INITIAL_INHERITED: Required<InheritedStyle> = {
  fontFamily: 'serif',
  fontSize: px(16),
  fontWeight: 400,
  fontStyle: 'normal',
  lineHeight: { type: 'keyword', value: 'normal' },
  color: { type: 'color', value: '#000000' },
  textAlign: 'left',
  whiteSpace: 'normal',
  wordBreak: 'normal',
  overflowWrap: 'normal',
  letterSpacing: px(0),
  wordSpacing: px(0),
  textIndent: px(0),
  textTransform: 'none',
};

/** 基于 tagName 的浏览器默认样式 */
const UA_STYLESHEET: Record<string, Partial<BoxModelStyle & InheritedStyle>> = {
  div: { display: 'block' },
  p: { display: 'block', marginTop: px(16), marginBottom: px(16) },
  h1: { display: 'block', marginTop: px(24), marginBottom: px(8), fontSize: px(32), fontWeight: 700 },
  h2: { display: 'block', marginTop: px(20), marginBottom: px(6), fontSize: px(24), fontWeight: 700 },
  h3: { display: 'block', marginTop: px(18), marginBottom: px(4), fontSize: px(20.67), fontWeight: 700 },
  h4: { display: 'block', marginTop: px(16), marginBottom: px(4), fontSize: px(16), fontWeight: 700 },
  h5: { display: 'block', marginTop: px(14), marginBottom: px(4), fontSize: px(13.28), fontWeight: 700 },
  h6: { display: 'block', marginTop: px(12), marginBottom: px(4), fontSize: px(11.2), fontWeight: 700 },
  span: { display: 'inline' },
  strong: { fontWeight: 700 },
  b: { fontWeight: 700 },
  em: { fontStyle: 'italic' },
  i: { fontStyle: 'italic' },
  a: { display: 'inline', color: { type: 'color', value: '#0000ee' } },
  ul: { display: 'block', marginTop: px(16), marginBottom: px(16), paddingLeft: px(40) },
  ol: { display: 'block', marginTop: px(16), marginBottom: px(16), paddingLeft: px(40) },
  li: { display: 'block' },
  img: { display: 'inline' },
  pre: { display: 'block', marginTop: px(16), marginBottom: px(16), whiteSpace: 'pre' },
  code: { fontFamily: 'monospace' },
  blockquote: { display: 'block', marginTop: px(16), marginBottom: px(16) },
  article: { display: 'block' },
  section: { display: 'block' },
  header: { display: 'block' },
  footer: { display: 'block' },
  main: { display: 'block' },
  nav: { display: 'block' },
  aside: { display: 'block' },
  figure: { display: 'block', marginTop: px(16), marginBottom: px(16) },
  figcaption: { display: 'block' },
  hr: { display: 'block', marginTop: px(8), marginBottom: px(8) },
  body: { display: 'block', marginTop: px(8), marginRight: px(8), marginBottom: px(8), marginLeft: px(8) },
  html: { display: 'block' },
};

export function getUADefaults(tagName: string): Partial<BoxModelStyle & InheritedStyle> {
  return UA_STYLESHEET[tagName.toLowerCase()] ?? {};
}

/** Flexbox 属性初始值 */
export const INITIAL_FLEX: Required<FlexStyle> = {
  flexDirection: 'row',
  flexWrap: 'nowrap',
  justifyContent: 'flex-start',
  alignItems: 'stretch',
  alignContent: 'stretch',
  flexGrow: 0,
  flexShrink: 1,
  flexBasis: { type: 'keyword', value: 'auto' },
  alignSelf: 'auto',
  order: 0,
  gap: { type: 'keyword', value: 'normal' },
  rowGap: { type: 'keyword', value: 'normal' },
  columnGap: { type: 'keyword', value: 'normal' },
};

/** Grid 属性初始值 */
export const INITIAL_GRID: Required<GridStyle> = {
  gridTemplateColumns: [],
  gridTemplateRows: [],
  gridAutoColumns: [{ type: 'keyword', value: 'auto' }],
  gridAutoRows: [{ type: 'keyword', value: 'auto' }],
  gridAutoFlow: 'row',
  gridColumnStart: { type: 'keyword', value: 'auto' },
  gridColumnEnd: { type: 'keyword', value: 'auto' },
  gridRowStart: { type: 'keyword', value: 'auto' },
  gridRowEnd: { type: 'keyword', value: 'auto' },
  justifyItems: 'stretch',
  gap: { type: 'keyword', value: 'normal' },
  rowGap: { type: 'keyword', value: 'normal' },
  columnGap: { type: 'keyword', value: 'normal' },
};

