import { describe, it, expect } from 'vitest';
import { parseCSSValue, parseEdgeValues } from '../../../src/css/parser.js';

describe('parseCSSValue', () => {
  it('should parse px length', () => {
    expect(parseCSSValue('100px')).toEqual({ type: 'length', value: 100, unit: 'px' });
    expect(parseCSSValue('0px')).toEqual({ type: 'length', value: 0, unit: 'px' });
    expect(parseCSSValue('16.5px')).toEqual({ type: 'length', value: 16.5, unit: 'px' });
  });

  it('should parse bare number as px', () => {
    expect(parseCSSValue('0')).toEqual({ type: 'length', value: 0, unit: 'px' });
    expect(parseCSSValue('42')).toEqual({ type: 'length', value: 42, unit: 'px' });
  });

  it('should parse percentage', () => {
    expect(parseCSSValue('50%')).toEqual({ type: 'percentage', value: 50 });
    expect(parseCSSValue('100%')).toEqual({ type: 'percentage', value: 100 });
    expect(parseCSSValue('33.33%')).toEqual({ type: 'percentage', value: 33.33 });
  });

  it('should parse em', () => {
    expect(parseCSSValue('1.5em')).toEqual({ type: 'em', value: 1.5 });
    expect(parseCSSValue('2em')).toEqual({ type: 'em', value: 2 });
  });

  it('should parse rem', () => {
    expect(parseCSSValue('1rem')).toEqual({ type: 'rem', value: 1 });
    expect(parseCSSValue('0.5rem')).toEqual({ type: 'rem', value: 0.5 });
  });

  it('should parse keywords', () => {
    expect(parseCSSValue('auto')).toEqual({ type: 'keyword', value: 'auto' });
    expect(parseCSSValue('normal')).toEqual({ type: 'keyword', value: 'normal' });
    expect(parseCSSValue('none')).toEqual({ type: 'keyword', value: 'none' });
    expect(parseCSSValue('block')).toEqual({ type: 'keyword', value: 'block' });
    expect(parseCSSValue('inline')).toEqual({ type: 'keyword', value: 'inline' });
    expect(parseCSSValue('hidden')).toEqual({ type: 'keyword', value: 'hidden' });
    expect(parseCSSValue('content-box')).toEqual({ type: 'keyword', value: 'content-box' });
    expect(parseCSSValue('border-box')).toEqual({ type: 'keyword', value: 'border-box' });
  });

  it('should parse colors', () => {
    expect(parseCSSValue('#ff0000')).toEqual({ type: 'color', value: '#ff0000' });
    expect(parseCSSValue('#000')).toEqual({ type: 'color', value: '#000' });
    expect(parseCSSValue('rgb(0, 0, 0)')).toEqual({ type: 'color', value: 'rgb(0, 0, 0)' });
    expect(parseCSSValue('rgba(255, 0, 0, 0.5)')).toEqual({ type: 'color', value: 'rgba(255, 0, 0, 0.5)' });
  });

  it('should parse calc()', () => {
    expect(parseCSSValue('calc(100% - 20px)')).toEqual({
      type: 'calc',
      expression: 'calc(100% - 20px)',
    });
  });

  it('should be case insensitive', () => {
    expect(parseCSSValue('AUTO')).toEqual({ type: 'keyword', value: 'auto' });
    expect(parseCSSValue('Block')).toEqual({ type: 'keyword', value: 'block' });
    expect(parseCSSValue('#FF0000')).toEqual({ type: 'color', value: '#FF0000' });
  });

  it('should trim whitespace', () => {
    expect(parseCSSValue('  100px  ')).toEqual({ type: 'length', value: 100, unit: 'px' });
  });

  it('should throw for invalid values', () => {
    expect(() => parseCSSValue('')).toThrow();
    expect(() => parseCSSValue('abc')).toThrow();
    expect(() => parseCSSValue('10xx')).toThrow();
  });
});

describe('parseEdgeValues', () => {
  it('should parse 1-value shorthand', () => {
    const result = parseEdgeValues('10px');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'length', value: 10, unit: 'px' });
  });

  it('should parse 2-value shorthand', () => {
    const result = parseEdgeValues('10px 20px');
    expect(result).toHaveLength(2);
  });

  it('should parse 3-value shorthand', () => {
    const result = parseEdgeValues('10px 20px 30px');
    expect(result).toHaveLength(3);
  });

  it('should parse 4-value shorthand', () => {
    const result = parseEdgeValues('10px 20px 30px 40px');
    expect(result).toHaveLength(4);
  });
});
