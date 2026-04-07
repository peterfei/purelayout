/**
 * Pretext 文本测量器
 *
 * 使用 @chenglou/pretext 进行文本测量。Pretext 是零依赖的 JS/TS
 * 多行文本布局库，内部基于 Canvas API 测量字形。
 *
 * 特性：
 * - measureTextWidth / getFontMetrics 使用 Canvas 精确测量
 * - 内置宽度缓存，避免重复测量
 * - 额外暴露 layoutLines() 高级 API 用于多行文本布局
 * - 三级降级：Pretext+Canvas → Canvas → 字符宽度估算
 */
import type { TextMeasurer, TextStyle, FontMetrics, TextSegment } from '../types/text.js';
import { segmentText, estimateFontMetrics } from './measurer.js';

// ===== Pretext 类型定义（optional dependency，无 .d.ts） =====

interface PretextLayoutLine {
  text: string;
  width: number;
  start: PretextLayoutCursor;
  end: PretextLayoutCursor;
}

interface PretextLayoutCursor {
  segmentIndex: number;
  graphemeIndex: number;
}

interface PretextLayoutWithLinesResult {
  height: number;
  lineCount: number;
  lines: PretextLayoutLine[];
}

interface PretextModule {
  prepare: (
    text: string,
    font: string,
    options?: { whiteSpace?: string },
  ) => unknown;
  prepareWithSegments: (
    text: string,
    font: string,
    options?: { whiteSpace?: string },
  ) => { _tag: string }; // Inlined PretextPreparedWithSegments
  layout: (
    prepared: unknown,
    maxWidth: number,
    lineHeight: number,
  ) => { height: number; lineCount: number };
  layoutWithLines: (
    prepared: { _tag: string }, // Inlined PretextPreparedWithSegments
    maxWidth: number,
    lineHeight: number,
  ) => PretextLayoutWithLinesResult;
  clearCache: () => void;
  setLocale: (locale?: string) => void;
}

// ===== Canvas 类型 =====

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CanvasContext = any;

// ===== 模块导入 =====

function importPretext(): PretextModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@chenglou/pretext');
    return mod && typeof mod.prepareWithSegments === 'function' ? mod : null;
  } catch {
    return null;
  }
}

function importCanvas(): {
  createCanvas: (w: number, h: number) => { getContext: (type: string) => CanvasContext };
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('canvas');
    return mod && typeof mod.createCanvas === 'function' ? mod : null;
  } catch {
    return null;
  }
}

// ===== PretextMeasurer =====

export interface PretextLayoutLineResult {
  text: string;
  width: number;
}

export class PretextMeasurer implements TextMeasurer {
  private pretext: PretextModule | null;
  private ctx: CanvasContext | null;
  private useFallback: boolean;

  /** 宽度缓存: key = "text\x00fontString" */
  private widthCache: Map<string, number>;
  /** 字体度量缓存: key = fontString */
  private metricsCache: Map<string, FontMetrics>;

  constructor() {
    this.pretext = importPretext();
    const canvasMod = importCanvas();

    if (canvasMod) {
      const canvas = canvasMod.createCanvas(1, 1);
      this.ctx = canvas.getContext('2d');
    } else {
      this.ctx = null;
    }

    // 有 Canvas 就能精确测量；Pretext 额外提供 layoutLines 等高级 API
    this.useFallback = !this.ctx;

    this.widthCache = new Map();
    this.metricsCache = new Map();
  }

  /** Pretext 是否可用 */
  get isPretextAvailable(): boolean {
    return this.pretext !== null;
  }

  /** Canvas 是否可用 */
  get isCanvasAvailable(): boolean {
    return this.ctx !== null;
  }

  private buildFontString(style: TextStyle): string {
    const styleStr = style.fontStyle === 'italic' ? 'italic' : 'normal';
    const weightStr = String(style.fontWeight);
    return `${styleStr} ${weightStr} ${style.fontSize}px ${style.fontFamily}`;
  }

  // ===== TextMeasurer 接口 =====

  measureTextWidth(text: string, style: TextStyle): number {
    console.log(`[MeasureText Debug] measureTextWidth: Text="${text}", Style=${JSON.stringify(style)}`);
    if (text.length === 0) return 0;
    if (this.useFallback) {
      const fallbackWidth = this.fallbackMeasure(text, style);
      console.log(`[MeasureText Debug] Fallback measureTextWidth for "${text}": ${fallbackWidth}`);
      return fallbackWidth;
    }

    const font = this.buildFontString(style);
    const cacheKey = `${text}\x00${font}\x00${style.letterSpacing}`;
    const cached = this.widthCache.get(cacheKey);
    if (cached !== undefined) {
      console.log(`[MeasureText Debug] Cached measureTextWidth for "${text}": ${cached}`);
      return cached;
    }

    this.ctx!.font = font;
    const width = this.ctx!.measureText(text).width + style.letterSpacing * text.length;
    console.log(`[MeasureText Debug] Canvas measureTextWidth for "${text}": ${width}`);
    this.widthCache.set(cacheKey, width);
    return width;
  }

  getFontMetrics(style: TextStyle): FontMetrics {
    console.log(`[MeasureText Debug] getFontMetrics: Style=${JSON.stringify(style)}`);
    if (this.useFallback) {
      const fallbackMetrics = estimateFontMetrics(style);
      console.log(`[MeasureText Debug] Fallback getFontMetrics: ${JSON.stringify(fallbackMetrics)}`);
      return fallbackMetrics;
    }

    const font = this.buildFontString(style);
    const cached = this.metricsCache.get(font);
    if (cached) {
      console.log(`[MeasureText Debug] Cached getFontMetrics: ${JSON.stringify(cached)}`);
      return cached;
    }

    this.ctx!.font = font;
    const metrics = this.ctx!.measureText('Mxgyp');

    const ascent = metrics.actualBoundingBoxAscent ?? style.fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent ?? style.fontSize * 0.2;
    const emHeight = style.fontSize;

    const result: FontMetrics = {
      ascent,
      descent,
      lineHeight: style.fontSize * 1.2,
      emHeight,
      gap: Math.max(0, (style.fontSize * 1.2 - ascent - descent) / 2),
    };
    console.log(`[MeasureText Debug] Canvas getFontMetrics: ${JSON.stringify(result)}`);
    this.metricsCache.set(font, result);
    return result;
  }

  measureTextSegments(text: string, style: TextStyle): TextSegment[] {
    const segments = segmentText(text, style);
    for (const seg of segments) {
      seg.width = this.measureTextWidth(seg.text, style);
    }
    return segments;
  }

  // ===== Pretext 增值 API =====

  /**
   * 使用 Pretext 的原生换行引擎进行多行布局。
   * 返回每行的文本和宽度信息。
   *
   * @param text   要布局的文本
   * @param style  文本样式
   * @param maxWidth 最大行宽（px）
   * @returns 行信息数组，每行包含 text 和 width
   */
  layoutLines(text: string, style: TextStyle, maxWidth: number): PretextLayoutLineResult[] {
    if (!this.pretext || text.length === 0) return [];

    const font = this.buildFontString(style);
    const lineHeight = style.fontSize * 1.2;
    const prepared = this.pretext.prepareWithSegments(text, font);
    const result = this.pretext.layoutWithLines(prepared, maxWidth, lineHeight);

    return result.lines.map((line) => ({
      text: line.text,
      width: line.width + style.letterSpacing * line.text.length,
    }));
  }

  /**
   * 使用 Pretext 布局多行文本，返回总高度和行数。
   */
  measureTextHeight(text: string, style: TextStyle, maxWidth: number): { height: number; lineCount: number } {
    if (!this.pretext || text.length === 0) return { height: 0, lineCount: 0 };

    const font = this.buildFontString(style);
    const lineHeight = style.fontSize * 1.2;
    const prepared = this.pretext.prepare(text, font);
    return this.pretext.layout(prepared, maxWidth, lineHeight);
  }

  /**
   * 清除内部缓存 + Pretext 内部缓存。
   */
  clearCache(): void {
    this.widthCache.clear();
    this.metricsCache.clear();
    this.pretext?.clearCache();
  }

  /**
   * 设置区域设置，影响 Pretext 的断词和连字符行为。
   */
  setLocale(locale?: string): void {
    this.pretext?.setLocale(locale);
  }

  // ===== 降级测量 =====

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
