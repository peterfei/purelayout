import { describe, it, expect } from 'vitest';
import { processWhitespace, allowsSoftWrap } from '../../../../src/layout/inline/whitespace.js';

describe('processWhitespace', () => {
  it('should collapse whitespace for normal', () => {
    expect(processWhitespace('  hello   world  ', 'normal')).toBe('hello world');
  });

  it('should collapse newlines for normal', () => {
    expect(processWhitespace('hello\nworld', 'normal')).toBe('hello world');
  });

  it('should collapse tabs for normal', () => {
    expect(processWhitespace('hello\tworld', 'normal')).toBe('hello world');
  });

  it('should trim for normal', () => {
    expect(processWhitespace('  hello  ', 'normal')).toBe('hello');
  });

  it('should collapse whitespace for nowrap', () => {
    expect(processWhitespace('  hello   world  ', 'nowrap')).toBe('hello world');
  });

  it('should preserve whitespace for pre', () => {
    expect(processWhitespace('  hello   world  ', 'pre')).toBe('  hello   world  ');
  });

  it('should preserve newlines for pre', () => {
    expect(processWhitespace('hello\nworld', 'pre')).toBe('hello\nworld');
  });

  it('should preserve whitespace for pre-wrap', () => {
    expect(processWhitespace('  hello   world  ', 'pre-wrap')).toBe('  hello   world  ');
  });

  it('should collapse spaces but keep newlines for pre-line', () => {
    expect(processWhitespace('  hello   \n  world  ', 'pre-line')).toBe('hello\nworld');
  });
});

describe('allowsSoftWrap', () => {
  it('should allow soft wrap for normal', () => {
    expect(allowsSoftWrap('normal')).toBe(true);
  });

  it('should NOT allow soft wrap for nowrap', () => {
    expect(allowsSoftWrap('nowrap')).toBe(false);
  });

  it('should NOT allow soft wrap for pre', () => {
    expect(allowsSoftWrap('pre')).toBe(false);
  });

  it('should allow soft wrap for pre-wrap', () => {
    expect(allowsSoftWrap('pre-wrap')).toBe(true);
  });

  it('should allow soft wrap for pre-line', () => {
    expect(allowsSoftWrap('pre-line')).toBe(true);
  });
});
