/**
 * Canvas 文本测量器
 *
 * 使用 Node.js canvas 包的 measureText。
 * 在 Node.js 环境中需要安装 `canvas` npm 包。
 */
import type { TextMeasurer, TextStyle, FontMetrics, TextSegment } from '../types/text.js';
import { segmentText, estimateFontMetrics } from './measurer.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CanvasContext = any;

function importCanvas(): { createCanvas: (w: number, h: number) => { getContext: (type: string) => CanvasContext } } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('canvas');
    return mod && mod.createCanvas ? mod : null;
  } catch {
    return null;
  }
}

export class CanvasMeasurer implements TextMeasurer {
  private ctx: CanvasContext | null;
  private useFallback: boolean;

  constructor() {
    const mod = importCanvas();
    if (mod) {
      const canvas = mod.createCanvas(1, 1);
      this.ctx = canvas.getContext('2d');
      this.useFallback = false;
    } else {
      this.ctx = null;
      this.useFallback = true;
    }
  }

  private buildFontString(style: TextStyle): string {
    const styleStr = style.fontStyle === 'italic' ? 'italic' : 'normal';
    const weightStr = String(style.fontWeight);
    return `${styleStr} ${weightStr} ${style.fontSize}px ${style.fontFamily}`;
  }

  measureTextWidth(text: string, style: TextStyle): number {
    if (this.useFallback || !this.ctx) {
      return this.fallbackMeasure(text, style);
    }

    this.ctx.font = this.buildFontString(style);
    return this.ctx.measureText(text).width + style.letterSpacing * text.length;
  }

  getFontMetrics(style: TextStyle): FontMetrics {
    if (this.useFallback || !this.ctx) {
      return estimateFontMetrics(style);
    }

    this.ctx.font = this.buildFontString(style);
    const metrics = this.ctx.measureText('Mxgyp');

    const ascent = metrics.actualBoundingBoxAscent ?? style.fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent ?? style.fontSize * 0.2;
    const emHeight = style.fontSize;
    const lineHeight = ascent + descent;
    const gap = Math.max(0, (style.fontSize * 1.2 - lineHeight) / 2);

    return {
      ascent,
      descent,
      lineHeight: style.fontSize * 1.2,
      emHeight,
      gap,
    };
  }

  measureTextSegments(text: string, style: TextStyle): TextSegment[] {
    const segments = segmentText(text, style);
    for (const seg of segments) {
      seg.width = this.measureTextWidth(seg.text, style);
    }
    return segments;
  }

  private fallbackMeasure(text: string, style: TextStyle): number {
    let width = 0;
    const charWidth = style.fontSize * 0.6;
    const cjkWidth = style.fontSize;
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (
        (code >= 0x4e00 && code <= 0x9fff) ||
        (code >= 0x3040 && code <= 0x309f) ||
        (code >= 0x30a0 && code <= 0x30ff)
      ) {
        width += cjkWidth;
      } else {
        width += charWidth;
      }
    }
    return width + style.letterSpacing * text.length;
  }
}
