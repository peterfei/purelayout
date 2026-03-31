import { describe, it, expect } from 'vitest';
import { expandEdgeShorthand } from '../../../src/css/shorthand.js';
import { px } from '../../../src/utils/format.js';

describe('expandEdgeShorthand', () => {
  it('should expand 1 value to all edges', () => {
    const result = expandEdgeShorthand([px(10)]);
    expect(result).toEqual({
      top: px(10),
      right: px(10),
      bottom: px(10),
      left: px(10),
    });
  });

  it('should expand 2 values (vertical horizontal)', () => {
    const result = expandEdgeShorthand([px(10), px(20)]);
    expect(result).toEqual({
      top: px(10),
      right: px(20),
      bottom: px(10),
      left: px(20),
    });
  });

  it('should expand 3 values (top horizontal bottom)', () => {
    const result = expandEdgeShorthand([px(10), px(20), px(30)]);
    expect(result).toEqual({
      top: px(10),
      right: px(20),
      bottom: px(30),
      left: px(20),
    });
  });

  it('should expand 4 values (top right bottom left)', () => {
    const result = expandEdgeShorthand([px(10), px(20), px(30), px(40)]);
    expect(result).toEqual({
      top: px(10),
      right: px(20),
      bottom: px(30),
      left: px(40),
    });
  });

  it('should throw for invalid value count', () => {
    expect(() => expandEdgeShorthand([])).toThrow();
    expect(() => expandEdgeShorthand([px(1), px(2), px(3), px(4), px(5)])).toThrow();
  });
});
