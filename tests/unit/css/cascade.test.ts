import { describe, it, expect } from 'vitest';
import { computeStyle, resolveLength } from '../../../src/css/cascade.js';
import type { StyleNode } from '../../../src/types/style.js';
import { px, em } from '../../../src/utils/format.js';

describe('computeStyle', () => {
  it('should apply initial values for div with no style', () => {
    const node: StyleNode = { tagName: 'div', style: {}, children: [] };
    const result = computeStyle(node, null);
    expect(result.boxModel.display).toBe('block');
    expect(result.boxModel.overflow).toBe('visible');
    expect(result.boxModel.boxSizing).toBe('content-box');
  });

  it('should apply UA defaults for p tag', () => {
    const node: StyleNode = { tagName: 'p', style: {}, children: [] };
    const result = computeStyle(node, null);
    expect(result.boxModel.display).toBe('block');
    expect(result.boxModel.marginTop).toEqual({ type: 'length', value: 16, unit: 'px' });
    expect(result.boxModel.marginBottom).toEqual({ type: 'length', value: 16, unit: 'px' });
  });

  it('should override UA defaults with user style', () => {
    const node: StyleNode = {
      tagName: 'p',
      style: { marginTop: px(40) },
      children: [],
    };
    const result = computeStyle(node, null);
    expect(result.boxModel.marginTop).toEqual({ type: 'length', value: 40, unit: 'px' });
    expect(result.boxModel.marginBottom).toEqual({ type: 'length', value: 16, unit: 'px' });
  });

  it('should inherit font-size from parent', () => {
    const parent: StyleNode = {
      tagName: 'div',
      style: {},
      children: [],
    };
    const parentComputed = computeStyle(parent, null);

    const child: StyleNode = {
      tagName: 'span',
      style: {},
      children: [],
    };
    const result = computeStyle(child, parentComputed);
    expect(result.inherited.fontSize).toEqual(parentComputed.inherited.fontSize);
  });

  it('should resolve em values based on parent font-size', () => {
    const parent: StyleNode = {
      tagName: 'div',
      style: { fontSize: px(24) },
      children: [],
    };
    const parentComputed = computeStyle(parent, null);

    const child: StyleNode = {
      tagName: 'span',
      style: { fontSize: em(2) },
      children: [],
    };
    const result = computeStyle(child, parentComputed);
    // 2em * 24px = 48px
    expect(result.inherited.fontSize).toEqual({ type: 'length', value: 48, unit: 'px' });
  });

  it('should resolve rem values based on root font-size', () => {
    const node: StyleNode = {
      tagName: 'div',
      style: { fontSize: { type: 'rem', value: 1.5 } },
      children: [],
    };
    const result = computeStyle(node, null, 16);
    // 1.5rem * 16px = 24px
    expect(result.inherited.fontSize).toEqual({ type: 'length', value: 24, unit: 'px' });
  });

  it('should use custom root font-size', () => {
    const node: StyleNode = {
      tagName: 'div',
      style: { fontSize: { type: 'rem', value: 1 } },
      children: [],
    };
    const result = computeStyle(node, null, 10);
    expect(result.inherited.fontSize).toEqual({ type: 'length', value: 10, unit: 'px' });
  });

  it('should inherit color from parent', () => {
    const parent: StyleNode = {
      tagName: 'div',
      style: { color: { type: 'color', value: '#ff0000' } },
      children: [],
    };
    const parentComputed = computeStyle(parent, null);

    const child: StyleNode = {
      tagName: 'span',
      style: {},
      children: [],
    };
    const result = computeStyle(child, parentComputed);
    expect(result.inherited.color).toEqual({ type: 'color', value: '#ff0000' });
  });

  it('should override inherited color with user style', () => {
    const parent: StyleNode = {
      tagName: 'div',
      style: { color: { type: 'color', value: '#ff0000' } },
      children: [],
    };
    const parentComputed = computeStyle(parent, null);

    const child: StyleNode = {
      tagName: 'span',
      style: { color: { type: 'color', value: '#0000ff' } },
      children: [],
    };
    const result = computeStyle(child, parentComputed);
    expect(result.inherited.color).toEqual({ type: 'color', value: '#0000ff' });
  });
});

describe('resolveLength', () => {
  it('should resolve px length', () => {
    expect(resolveLength({ type: 'length', value: 100, unit: 'px' })).toBe(100);
  });

  it('should return fallback for keyword', () => {
    expect(resolveLength({ type: 'keyword', value: 'auto' }, 50)).toBe(50);
  });

  it('should return fallback for undefined', () => {
    expect(resolveLength(undefined, 42)).toBe(42);
  });
});
