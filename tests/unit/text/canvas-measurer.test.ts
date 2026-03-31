import { describe, it, expect } from 'vitest';
import { FallbackMeasurer } from '../../../src/text/fallback-measurer.js';
import type { TextStyle } from '../../../src/types/text.js';

const defaultStyle: TextStyle = {
  fontFamily: 'serif',
  fontSize: 16,
  fontWeight: 400,
  fontStyle: 'normal',
  letterSpacing: 0,
  wordSpacing: 0,
};

describe('FallbackMeasurer', () => {
  const measurer = new FallbackMeasurer();

  it('should measure English text width', () => {
    const width = measurer.measureTextWidth('Hello World', defaultStyle);
    expect(width).toBeGreaterThan(0);
  });

  it('should measure empty text as 0', () => {
    expect(measurer.measureTextWidth('', defaultStyle)).toBe(0);
  });

  it('should return wider width for CJK text', () => {
    const englishWidth = measurer.measureTextWidth('abc', defaultStyle);
    const cjkWidth = measurer.measureTextWidth('abc', { ...defaultStyle });
    // Same char count, CJK should be wider per character
    const cjkActual = measurer.measureTextWidth('你好世', defaultStyle);
    expect(cjkActual).toBeGreaterThan(englishWidth);
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

    // Should have non-zero widths
    const totalWidth = segments.reduce((sum, seg) => sum + seg.width, 0);
    expect(totalWidth).toBeGreaterThan(0);

    // Should mark whitespace
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
});
