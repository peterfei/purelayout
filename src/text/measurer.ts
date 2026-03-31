/**
 * 文本测量基础逻辑
 */
import type { TextStyle, TextSegment } from '../types/text.js';

/**
 * 将文本拆分为 segments，标记空白和断点
 */
export function segmentText(text: string, style: TextStyle): TextSegment[] {
  if (text.length === 0) return [];

  const segments: TextSegment[] = [];
  let current = '';
  let isWhitespace = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const chIsWhitespace = isWhitespaceChar(ch);

    if (chIsWhitespace !== isWhitespace || current.length === 0) {
      if (current.length > 0) {
        segments.push(createSegment(current, isWhitespace, segments.length));
      }
      current = ch;
      isWhitespace = chIsWhitespace;
    } else {
      current += ch;
    }
  }

  if (current.length > 0) {
    segments.push(createSegment(current, isWhitespace, segments.length));
  }

  return segments;
}

function createSegment(text: string, isWhitespace: boolean, _index: number): TextSegment {
  return {
    text,
    width: 0, // 将由 TextMeasurer 填充
    isWhitespace,
    canBreakBefore: !isWhitespace && isCJK(text.charCodeAt(0)),
    canBreakAfter: !isWhitespace && isCJK(text.charCodeAt(text.length - 1)),
  };
}

function isWhitespaceChar(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function isCJK(code: number): boolean {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0x30a0 && code <= 0x30ff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

/**
 * 默认的文本宽度估算（基于字符平均宽度）
 * 用于没有 Canvas 或 Pretext 的环境
 */
export function estimateTextWidth(text: string, style: TextStyle): number {
  // 粗略估算：英文 ~0.6 * fontSize, CJK ~1.0 * fontSize
  let width = 0;
  const charWidth = style.fontSize * 0.6;
  const cjkWidth = style.fontSize;

  for (const ch of text) {
    const code = ch.charCodeAt(0);
    width += isCJK(code) ? cjkWidth : charWidth;
  }

  return width + style.letterSpacing * text.length;
}

/**
 * 默认的字体度量估算
 */
export function estimateFontMetrics(style: TextStyle): {
  ascent: number;
  descent: number;
  lineHeight: number;
  emHeight: number;
  gap: number;
} {
  const emHeight = style.fontSize;
  const ascent = emHeight * 0.8;
  const descent = emHeight * 0.2;
  const lineHeight = emHeight * 1.2;
  const gap = (lineHeight - emHeight) / 2;

  return { ascent, descent, lineHeight, emHeight, gap };
}
