/**
 * Line Box 构建
 */
import type { LineBox, LineFragment, LayoutOptions } from '../../types/layout.js';
import type { TextStyle, TextSegment } from '../../types/text.js';
import { findBreakOpportunities, splitAtBreak } from './line-break.js';

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
): LineBox[] {
  const lineBoxes: LineBox[] = [];
  let currentFragments: InlineFragment[] = [];
  let currentLineWidth = 0;

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
      descent: metrics.descent,
      segments,
    });
  }

  for (const frag of processed) {
    if (frag.width <= availableWidth - currentLineWidth || currentLineWidth === 0) {
      // 放入当前行
      currentFragments.push(frag);
      currentLineWidth += frag.width;
    } else {
      // 需要换行
      if (currentFragments.length > 0) {
        lineBoxes.push(createLineBox(currentFragments));
      }

      // 尝试在断点处拆分
      const remainingWidth = availableWidth;
      if (frag.width > remainingWidth) {
        // 文本超出一行，需要拆分
        const splitResult = splitFragment(frag, remainingWidth, options);
        if (splitResult.first) {
          // 修正上一行（如果上一行还有空间的话就加上 first）
          // 简化：first 放到新行
          lineBoxes.push(createLineBox([splitResult.first]));
        }
        if (splitResult.remainder) {
          currentFragments = [splitResult.remainder];
          currentLineWidth = splitResult.remainder.width;
        } else {
          currentFragments = [];
          currentLineWidth = 0;
        }
      } else {
        currentFragments = [frag];
        currentLineWidth = frag.width;
      }
    }
  }

  // 最后一行
  if (currentFragments.length > 0) {
    lineBoxes.push(createLineBox(currentFragments));
  }

  return lineBoxes;
}

function createLineBox(fragments: InlineFragment[]): LineBox {
  let maxAscent = 0;
  let maxDescent = 0;
  let contentWidth = 0;
  const lineFragments: LineFragment[] = [];
  let x = 0;

  for (const frag of fragments) {
    maxAscent = Math.max(maxAscent, frag.ascent);
    maxDescent = Math.max(maxDescent, frag.descent);

    for (const seg of frag.segments) {
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
    }

    contentWidth += frag.width;
  }

  const contentHeight = maxAscent + maxDescent;
  // 使用第一个片段的 style 获取 lineHeight
  const firstStyle = fragments[0]?.style;
  const computedLineHeight = firstStyle
    ? maxAscent + maxDescent // 简化：使用实际内容高度
    : contentHeight;
  const halfLeading = Math.max(0, (computedLineHeight - contentHeight) / 2);

  return {
    y: 0,
    height: computedLineHeight + halfLeading * 2,
    baseline: maxAscent + halfLeading,
    width: contentWidth,
    fragments: lineFragments,
  };
}

interface SplitResult {
  first: InlineFragment | null;
  remainder: InlineFragment | null;
}

function splitFragment(
  frag: InlineFragment,
  maxWidth: number,
  options: LayoutOptions,
): SplitResult {
  const breakOpportunities = findBreakOpportunities(
    frag.segments,
    frag.style,
    options,
  );

  if (breakOpportunities.length === 0) {
    return { first: frag, remainder: null };
  }

  // 找到第一个不超过 maxWidth 的断点
  let accumulatedWidth = 0;
  let breakIndex = -1;

  for (const opp of breakOpportunities) {
    if ((accumulatedWidth + (frag.segments[opp]?.width ?? 0)) <= maxWidth) {
      breakIndex = opp;
    } else {
      break;
    }
    accumulatedWidth += frag.segments[opp]?.width ?? 0;
  }

  if (breakIndex < 0) {
    // 无法在合适位置断开，整体放到下一行
    return { first: null, remainder: frag };
  }

  const firstSegments = frag.segments.slice(0, breakIndex + 1);
  const remainderSegments = frag.segments.slice(breakIndex + 1);

  const firstWidth = firstSegments.reduce((s, seg) => s + seg.width, 0);
  const remainderWidth = remainderSegments.reduce((s, seg) => s + seg.width, 0);

  return {
    first: {
      ...frag,
      text: firstSegments.map((s) => s.text).join(''),
      width: firstWidth,
      segments: firstSegments,
    },
    remainder:
      remainderSegments.length > 0
        ? {
            ...frag,
            text: remainderSegments.map((s) => s.text).join(''),
            width: remainderWidth,
            segments: remainderSegments,
          }
        : null,
  };
}
