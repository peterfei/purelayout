import { describe, it, expect } from 'vitest';
import { PretextMeasurer } from '../../../src/text/pretext-measurer.js';
import type { TextStyle } from '../../../src/types/text.js';

const defaultStyle: TextStyle = {
  fontFamily: 'serif',
  fontSize: 16,
  fontWeight: 400,
  fontStyle: 'normal',
  letterSpacing: 0,
  wordSpacing: 0,
};

// 检测依赖可用性
let canvasAvailable = false;
let pretextAvailable = false;
try {
  require('canvas');
  canvasAvailable = true;
} catch { /* noop */ }
try {
  require('@chenglou/pretext');
  pretextAvailable = true;
} catch { /* noop */ }

describe('PretextMeasurer', () => {
  const measurer = new PretextMeasurer();

  it('should report canvas availability', () => {
    expect(measurer.isCanvasAvailable).toBe(canvasAvailable);
  });

  it('should report pretext availability', () => {
    expect(measurer.isPretextAvailable).toBe(pretextAvailable);
  });

  it('should measure English text width', () => {
    const width = measurer.measureTextWidth('Hello World', defaultStyle);
    expect(width).toBeGreaterThan(0);
  });

  it('should measure empty text as 0', () => {
    expect(measurer.measureTextWidth('', defaultStyle)).toBe(0);
  });

  it('should return wider width for CJK text', () => {
    const englishWidth = measurer.measureTextWidth('abc', defaultStyle);
    const cjkWidth = measurer.measureTextWidth('你好世', defaultStyle);
    expect(cjkWidth).toBeGreaterThan(englishWidth);
  });

  it('should get font metrics', () => {
    const metrics = measurer.getFontMetrics(defaultStyle);
    expect(metrics.ascent).toBeGreaterThan(0);
    expect(metrics.descent).toBeGreaterThan(0);
    expect(metrics.lineHeight).toBeGreaterThan(0);
    expect(metrics.ascent + metrics.descent).toBeLessThanOrEqual(metrics.lineHeight);
  });

  it('should respect font-size in metrics', () => {
    const small = measurer.getFontMetrics({ ...defaultStyle, fontSize: 10 });
    const large = measurer.getFontMetrics({ ...defaultStyle, fontSize: 32 });
    expect(large.ascent).toBeGreaterThan(small.ascent);
    expect(large.lineHeight).toBeGreaterThan(small.lineHeight);
  });

  it('should measure text segments', () => {
    const segments = measurer.measureTextSegments('hello world', defaultStyle);
    expect(segments.length).toBeGreaterThanOrEqual(2);
    const totalWidth = segments.reduce((sum, seg) => sum + seg.width, 0);
    expect(totalWidth).toBeGreaterThan(0);
    const wsSegments = segments.filter((s) => s.isWhitespace);
    expect(wsSegments.length).toBeGreaterThanOrEqual(1);
  });

  it('should respect letter-spacing', () => {
    const noSpacing = measurer.measureTextWidth('abc', defaultStyle);
    const withSpacing = measurer.measureTextWidth('abc', {
      ...defaultStyle,
      letterSpacing: 5,
    });
    expect(withSpacing).toBe(noSpacing + 15); // 3 chars * 5px
  });

  it('should cache width measurements', () => {
    const w1 = measurer.measureTextWidth('cached text', defaultStyle);
    const w2 = measurer.measureTextWidth('cached text', defaultStyle);
    expect(w1).toBe(w2);
  });

  it('should clear cache without errors', () => {
    measurer.clearCache();
    const width = measurer.measureTextWidth('after clear', defaultStyle);
    expect(width).toBeGreaterThan(0);
  });

  it('should handle different font styles', () => {
    const normal = measurer.measureTextWidth('text', defaultStyle);
    const italic = measurer.measureTextWidth('text', {
      ...defaultStyle,
      fontStyle: 'italic',
    });
    expect(italic).toBeGreaterThan(0);
    // italic may differ from normal
  });

  it('should handle different font weights', () => {
    const light = measurer.measureTextWidth('text', {
      ...defaultStyle,
      fontWeight: 300,
    });
    const bold = measurer.measureTextWidth('text', {
      ...defaultStyle,
      fontWeight: 700,
    });
    expect(bold).toBeGreaterThan(0);
    expect(light).toBeGreaterThan(0);
  });
});

describe('PretextMeasurer — Pretext 高级 API', () => {
  const measurer = new PretextMeasurer();

  describe.skipIf(!pretextAvailable)('Pretext 可用时', () => {
    it('layoutLines 应返回多行布局结果', () => {
      const lines = measurer.layoutLines(
        'This is a long text that should wrap to multiple lines',
        defaultStyle,
        100,
      );
      expect(lines.length).toBeGreaterThan(1);
      lines.forEach((line) => {
        expect(line.text.length).toBeGreaterThan(0);
        expect(line.width).toBeGreaterThan(0);
      });
    });

    it('layoutLines 单行文本应返回一行', () => {
      const lines = measurer.layoutLines('short', defaultStyle, 500);
      expect(lines.length).toBe(1);
    });

    it('layoutLines 空文本应返回空数组', () => {
      expect(measurer.layoutLines('', defaultStyle, 100)).toEqual([]);
    });

    it('measureTextHeight 应返回高度和行数', () => {
      const result = measurer.measureTextHeight(
        'Long text wrapping to multiple lines here',
        defaultStyle,
        80,
      );
      expect(result.lineCount).toBeGreaterThan(1);
      expect(result.height).toBeGreaterThan(0);
    });

    it('setLocale 不应抛错', () => {
      measurer.setLocale('en');
      measurer.setLocale('zh');
      measurer.setLocale();
    });
  });

  describe.skipIf(pretextAvailable)('Pretext 不可用时', () => {
    it('layoutLines 应返回空数组', () => {
      expect(measurer.layoutLines('any text', defaultStyle, 100)).toEqual([]);
    });

    it('measureTextHeight 应返回零值', () => {
      const result = measurer.measureTextHeight('any text', defaultStyle, 100);
      expect(result.height).toBe(0);
      expect(result.lineCount).toBe(0);
    });

    it('setLocale 不应抛错', () => {
      measurer.setLocale('en');
    });
  });
});
