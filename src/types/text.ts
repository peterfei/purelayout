/**
 * 文本测量接口
 */

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  letterSpacing: number;
  wordSpacing: number;
}

export interface FontMetrics {
  ascent: number;
  descent: number;
  lineHeight: number;
  emHeight: number;
  gap: number;
}

export interface TextSegment {
  text: string;
  width: number;
  isWhitespace: boolean;
  canBreakBefore: boolean;
  canBreakAfter: boolean;
}

/**
 * 文本测量接口 — 核心抽象层
 *
 * PureLayout 不包含任何 DOM 操作，文本测量通过此接口注入。
 */
export interface TextMeasurer {
  measureTextWidth(text: string, style: TextStyle): number;
  getFontMetrics(style: TextStyle): FontMetrics;
  measureTextSegments(text: string, style: TextStyle): TextSegment[];
}
