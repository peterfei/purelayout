import { describe, it, expect } from 'vitest';
import { isInheritable, resolveInheritedStyle } from '../../../src/css/inherit.js';
import { INITIAL_INHERITED } from '../../../src/css/initial.js';
import { px } from '../../../src/utils/format.js';

describe('isInheritable', () => {
  it('should identify inheritable properties', () => {
    expect(isInheritable('fontSize')).toBe(true);
    expect(isInheritable('color')).toBe(true);
    expect(isInheritable('lineHeight')).toBe(true);
    expect(isInheritable('textAlign')).toBe(true);
    expect(isInheritable('fontFamily')).toBe(true);
  });

  it('should reject non-inheritable properties', () => {
    expect(isInheritable('display')).toBe(false);
    expect(isInheritable('width')).toBe(false);
    expect(isInheritable('margin')).toBe(false);
    expect(isInheritable('padding')).toBe(false);
  });
});

describe('resolveInheritedStyle', () => {
  it('should return initial values with no parent or defaults', () => {
    const result = resolveInheritedStyle({}, null, {});
    expect(result.fontFamily).toBe('serif');
    expect(result.fontSize).toEqual(px(16));
    expect(result.fontWeight).toBe(400);
  });

  it('should inherit from parent', () => {
    const parentInherited = {
      ...INITIAL_INHERITED,
      fontFamily: 'Arial',
      fontSize: px(20),
    };
    const result = resolveInheritedStyle({}, parentInherited, {});
    expect(result.fontFamily).toBe('Arial');
    expect(result.fontSize).toEqual(px(20));
  });

  it('should user style override parent', () => {
    const parentInherited = {
      ...INITIAL_INHERITED,
      color: { type: 'color' as const, value: '#ff0000' },
    };
    const result = resolveInheritedStyle(
      { color: { type: 'color', value: '#0000ff' } },
      parentInherited,
      {},
    );
    expect(result.color).toEqual({ type: 'color', value: '#0000ff' });
  });

  it('should apply UA defaults', () => {
    const result = resolveInheritedStyle(
      {},
      null,
      { fontFamily: 'monospace', fontSize: px(14) },
    );
    expect(result.fontFamily).toBe('monospace');
    expect(result.fontSize).toEqual(px(14));
  });
});
