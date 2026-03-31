/**
 * Fallback 文本测量器
 *
 * 不依赖任何外部库，基于字符宽度估算。
 * 精度有限，适用于不需要精确文本测量的场景。
 */
import type { TextMeasurer, TextStyle, FontMetrics, TextSegment } from '../types/text.js';
import { segmentText, estimateTextWidth, estimateFontMetrics } from './measurer.js';

export class FallbackMeasurer implements TextMeasurer {
  measureTextWidth(text: string, style: TextStyle): number {
    return estimateTextWidth(text, style);
  }

  getFontMetrics(style: TextStyle): FontMetrics {
    return estimateFontMetrics(style);
  }

  measureTextSegments(text: string, style: TextStyle): TextSegment[] {
    const segments = segmentText(text, style);
    for (const seg of segments) {
      seg.width = estimateTextWidth(seg.text, style);
    }
    return segments;
  }
}
