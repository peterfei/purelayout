/**
 * 软换行算法
 */
import type { TextSegment } from '../../types/text.js';
import type { TextStyle } from '../../types/text.js';
import type { LayoutOptions } from '../../types/layout.js';

/**
 * 查找文本片段中的换行断点
 */
export function findBreakOpportunities(
  segments: TextSegment[],
  style: TextStyle,
  _options: LayoutOptions,
): number[] {
  const opportunities: number[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.canBreakAfter) {
      opportunities.push(i);
    }

    // CJK 字符之间可以换行
    if (style && !isAllWhitespace(seg.text)) {
      for (let j = 0; j < seg.text.length; j++) {
        if (isCJKChar(seg.text.charCodeAt(j)) && j < seg.text.length - 1) {
          // CJK 字符后可以断开
          if (!opportunities.includes(i) || true) {
            // 在 segment 内部，标记子断点
            opportunities.push(i);
            break; // 一个 segment 标记一次即可
          }
        }
      }
    }
  }

  return opportunities;
}

/**
 * 在指定位置拆分片段列表
 */
export function splitAtBreak(
  segments: TextSegment[],
  breakIndex: number,
): { before: TextSegment[]; after: TextSegment[] } {
  return {
    before: segments.slice(0, breakIndex + 1),
    after: segments.slice(breakIndex + 1),
  };
}

function isCJKChar(code: number): boolean {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0x30a0 && code <= 0x30ff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

function isAllWhitespace(text: string): boolean {
  return text.trim().length === 0;
}
