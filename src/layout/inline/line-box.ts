/**
 * Line Box 构建
 */
import type { LineBox, LineFragment, LayoutOptions } from '../../types/layout.js';
import type { TextStyle, TextSegment } from '../../types/text.js';
import type { WhiteSpaceValue } from '../../types/style.js';

interface InlineFragment {
  text: string;
  style: TextStyle;
  sourceIndex: number;
  width: number;
  ascent: number;
  descent: number;
  segments: TextSegment[];
}

/**
 * 构建行框列表
 */
export function buildLineBoxes(
  fragments: Array<{ text: string; style: TextStyle; sourceIndex: number }>,
  availableWidth: number,
  options: LayoutOptions,
  whiteSpace: WhiteSpaceValue = 'normal',
): LineBox[] {
  const lineBoxes: LineBox[] = [];
  const noWrap = whiteSpace === 'nowrap';

  // 预处理所有片段
  const processed: InlineFragment[] = [];
  for (const frag of fragments) {
    const metrics = options.textMeasurer.getFontMetrics(frag.style);
    const segments = options.textMeasurer.measureTextSegments(frag.text, frag.style);
    const totalWidth = segments.reduce((sum, s) => sum + s.width, 0);

    processed.push({
      text: frag.text,
      style: frag.style,
      sourceIndex: frag.sourceIndex,
      width: totalWidth,
      ascent: metrics.ascent,
      descent: metrics.ascent, // Use ascent for descent for now, simpler
      segments,
    });
  }

  // 合并所有 segments 为一个列表，记录每个 segment 所属的 fragment
  // 换行标记（sourceIndex === -1）作为独立的行断点
  interface FlatSegment {
    seg: TextSegment;
    frag: InlineFragment;
    isLineBreak: boolean;
  }
  const allSegments: FlatSegment[] = [];
  for (const frag of processed) {
    if (frag.sourceIndex === -1 && frag.text === '') {
      // 换行标记
      allSegments.push({ seg: { text: '', width: 0, isWhitespace: true, canBreakBefore: false, canBreakAfter: false }, frag, isLineBreak: true });
    } else {
      for (const seg of frag.segments) {
        allSegments.push({ seg, frag, isLineBreak: false });
      }
    }
  }

  // nowrap: 所有内容放在一行（但仍然处理换行标记）
  if (whiteSpace === 'nowrap') {
    const nonBreakSegments = allSegments.filter(s => !s.isLineBreak);
    if (nonBreakSegments.length > 0) {
      lineBoxes.push(createLineBoxFromSegments(nonBreakSegments));
    }
    return lineBoxes;
  }

  // pre: 按换行标记分割，每段放在一行
  if (whiteSpace === 'pre') {
    let currentLine: FlatSegment[] = [];
    const lineHeight = processed.length > 0
      ? processed[0].ascent + processed[0].descent
      : 16 * 1.2; // fallback line height

    for (let i = 0; i < allSegments.length; i++) {
      const item = allSegments[i];
      if (item.isLineBreak) {
        if (currentLine.length > 0) {
          lineBoxes.push(createLineBoxFromSegments(currentLine));
        } else if (i < allSegments.length - 1) {
          // 空行：仅当后面还有内容时创建
          lineBoxes.push({
            y: 0,
            height: lineHeight,
            baseline: lineHeight * 0.8,
            width: 0,
            fragments: [],
          });
        }
        currentLine = [];
      } else {
        currentLine.push(item);
      }
    }
    if (currentLine.length > 0) {
      lineBoxes.push(createLineBoxFromSegments(currentLine));
    }
    return lineBoxes;
  }

  // 逐行填充
  let remaining: FlatSegment[] = [...allSegments];

  while (remaining.length > 0) {
    const lineSegments: FlatSegment[] = [];
    let lineWidth = 0;
    let i = 0;

    // 找出能放入当前行的 segments
    while (i < remaining.length) {
      const { seg } = remaining[i];
      const segWidth = seg.width;

      if (lineWidth + segWidth <= availableWidth) {
        lineSegments.push(remaining[i]);
        lineWidth += segWidth;
        i++;
      } else {
        // 当前 segment 放不下
        if (lineSegments.length === 0) {
          // 行是空的但 segment 放不下 — 必须强制放入（unbreakable word）
          lineSegments.push(remaining[i]);
          lineWidth += segWidth; // Ensure width is added even if forced
          i++;
        }
        break;
      }
    }

    remaining = remaining.slice(i);

    if (lineSegments.length > 0) {
      lineBoxes.push(createLineBoxFromSegments(lineSegments));
    }
  }

  return lineBoxes;
}

function createLineBoxFromSegments(items: Array<{ seg: TextSegment; frag: InlineFragment }>): LineBox {
  let maxAscent = 0;
  let maxDescent = 0;
  let contentWidth = 0;
  const lineFragments: LineFragment[] = [];
  let x = 0;

  for (const { seg, frag } of items) {
    maxAscent = Math.max(maxAscent, frag.ascent);
    maxDescent = Math.max(maxDescent, frag.descent);

    lineFragments.push({
      nodeIndex: frag.sourceIndex,
      x,
      y: 0,
      width: seg.width,
      height: frag.ascent + frag.descent,
      baseline: frag.ascent,
      text: seg.text,
      ascent: frag.ascent,
      descent: frag.descent,
    });
    x += seg.width;
    contentWidth += seg.width;
  }

  const contentHeight = maxAscent + maxDescent;
  const halfLeading = 0;

  return {
    y: 0,
    height: contentHeight + halfLeading * 2,
    baseline: maxAscent + halfLeading,
    width: contentWidth,
    fragments: lineFragments,
  };
}
