/**
 * CSS 属性注册表
 *
 * 记录哪些属性是可继承的、默认值是什么。
 */
import type { CSSValue } from '../types/css-values.js';
import { px } from '../utils/format.js';

/** 可继承的 CSS 属性名 */
export const INHERITABLE_PROPERTIES = new Set([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'color',
  'textAlign',
  'whiteSpace',
  'wordBreak',
  'overflowWrap',
  'letterSpacing',
  'wordSpacing',
  'textIndent',
  'textTransform',
]);

/** CSS 属性初始值 */
export const INITIAL_VALUES: Record<string, CSSValue> = {
  display: { type: 'keyword', value: 'inline' },
  overflow: { type: 'keyword', value: 'visible' },
  boxSizing: { type: 'keyword', value: 'content-box' },
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
  verticalAlign: { type: 'keyword', value: 'baseline' },
  fontFamily: { type: 'keyword', value: 'serif' },
  fontSize: px(16),
  fontWeight: { type: 'keyword', value: '400' },
  fontStyle: { type: 'keyword', value: 'normal' },
  lineHeight: { type: 'keyword', value: 'normal' },
  color: { type: 'color', value: '#000000' },
  textAlign: { type: 'keyword', value: 'left' },
  whiteSpace: { type: 'keyword', value: 'normal' },
  wordBreak: { type: 'keyword', value: 'normal' },
  overflowWrap: { type: 'keyword', value: 'normal' },
  letterSpacing: px(0),
  wordSpacing: px(0),
  textIndent: px(0),
  textTransform: { type: 'keyword', value: 'none' },
};
