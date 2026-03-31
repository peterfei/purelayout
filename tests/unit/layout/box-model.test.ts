import { describe, it, expect } from 'vitest';
import { layout, px, FallbackMeasurer } from '../../../src/index.js';
import type { StyleNode } from '../../../src/types/style.js';

const measurer = new FallbackMeasurer();

function div(style: Record<string, unknown>, children: (StyleNode | string)[] = []): StyleNode {
  return { tagName: 'div', style: style as StyleNode['style'], children };
}

describe('Box Model - content-box', () => {
  it('should use content-box by default', () => {
    const tree = div({
      width: px(200),
      height: px(100),
      paddingTop: px(10),
      paddingRight: px(20),
      paddingBottom: px(10),
      paddingLeft: px(20),
      borderTopWidth: px(5),
      borderRightWidth: px(5),
      borderBottomWidth: px(5),
      borderLeftWidth: px(5),
    });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    // content-box: width/height apply to content area
    expect(result.root.contentRect.width).toBe(200);
    expect(result.root.contentRect.height).toBe(100);
    expect(result.root.boxModel.paddingTop).toBe(10);
    expect(result.root.boxModel.paddingRight).toBe(20);
    expect(result.root.boxModel.borderLeft).toBe(5);
  });
});

describe('Box Model - border-box', () => {
  it('should subtract padding and border from width in border-box', () => {
    const tree = div({
      width: px(200),
      height: px(100),
      boxSizing: 'border-box' as const,
      paddingTop: px(10),
      paddingRight: px(20),
      paddingBottom: px(10),
      paddingLeft: px(20),
      borderTopWidth: px(5),
      borderRightWidth: px(5),
      borderBottomWidth: px(5),
      borderLeftWidth: px(5),
    });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    // border-box: width/height include padding + border
    // content width = 200 - 20 - 20 - 5 - 5 = 150
    expect(result.root.contentRect.width).toBe(150);
  });
});

describe('Box Model - auto width', () => {
  it('should fill container with auto width', () => {
    const tree = div({ containerWidth: px(500) });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.contentRect.width).toBe(800);
  });

  it('should respect min-width', () => {
    const tree = div({ width: px(100), minWidth: px(200) });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.contentRect.width).toBe(200);
  });

  it('should respect max-width', () => {
    const tree = div({ width: px(500), maxWidth: px(300) });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.contentRect.width).toBe(300);
  });
});
