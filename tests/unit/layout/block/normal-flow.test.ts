import { describe, it, expect } from 'vitest';
import { layout, getBoundingClientRect, px, FallbackMeasurer } from '../../../../src/index.js';
import type { StyleNode } from '../../../../src/types/style.js';

const measurer = new FallbackMeasurer();

function createDiv(style: Record<string, unknown>, children: (StyleNode | string)[] = []): StyleNode {
  return { tagName: 'div', style: style as StyleNode['style'], children };
}

describe('layout() - Block Normal Flow', () => {
  it('should layout a single block element', () => {
    const tree = createDiv({ width: px(400) });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.contentRect.width).toBe(400);
    expect(result.root.contentRect.height).toBe(0); // no children
    expect(result.root.boxModel.marginLeft).toBe(0);
    expect(result.root.boxModel.marginRight).toBe(0);
  });

  it('should layout block element with auto width filling container', () => {
    const tree = createDiv({});
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.contentRect.width).toBe(800);
  });

  it('should layout nested block elements', () => {
    const tree = createDiv(
      { width: px(600), padding: undefined },
      [createDiv({ width: px(300) })]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.contentRect.width).toBe(600);
    expect(result.root.children[0].contentRect.width).toBe(300);
  });

  it('should stack block children vertically', () => {
    const tree = createDiv(
      { width: px(400) },
      [
        createDiv({ width: px(400), height: px(100) }),
        createDiv({ width: px(400), height: px(200) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    const child1 = result.root.children[0];
    const child2 = result.root.children[1];

    expect(child1.contentRect.y).toBe(0);
    expect(child1.contentRect.height).toBe(100);
    expect(child2.contentRect.y).toBe(100); // stacked below
    expect(child2.contentRect.height).toBe(200);
  });

  it('should apply padding correctly', () => {
    const tree = createDiv({ width: px(400), paddingTop: px(20), paddingBottom: px(30) });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.boxModel.paddingTop).toBe(20);
    expect(result.root.boxModel.paddingBottom).toBe(30);
  });

  it('should apply border correctly', () => {
    const tree = createDiv({ width: px(400), borderTopWidth: px(5), borderBottomWidth: px(10) });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.boxModel.borderTop).toBe(5);
    expect(result.root.boxModel.borderBottom).toBe(10);
  });

  it('should apply box-sizing: border-box', () => {
    const tree = createDiv({
      width: px(400),
      boxSizing: 'border-box' as const,
      paddingTop: px(20),
      paddingBottom: px(30),
      paddingLeft: px(10),
      paddingRight: px(10),
    });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    // content width should be 400 - 10 - 10 = 380
    expect(result.root.contentRect.width).toBe(380);
  });

  it('should apply margin correctly', () => {
    const tree = createDiv({
      width: px(400),
      marginTop: px(10),
      marginRight: px(20),
      marginBottom: px(30),
      marginLeft: px(40),
    });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.boxModel.marginTop).toBe(10);
    expect(result.root.boxModel.marginRight).toBe(20);
    expect(result.root.boxModel.marginBottom).toBe(30);
    expect(result.root.boxModel.marginLeft).toBe(40);
  });
});

describe('getBoundingClientRect()', () => {
  it('should return margin box dimensions', () => {
    const tree = createDiv({
      width: px(100),
      height: px(50),
      marginTop: px(10),
      marginLeft: px(20),
      paddingTop: px(5),
      paddingLeft: px(15),
    });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const rect = getBoundingClientRect(result.root);

    // margin box width = margin-left + padding-left + content-width + padding-right + margin-right
    expect(rect.width).toBe(20 + 15 + 100 + 0 + 0); // 135
    expect(rect.height).toBe(10 + 5 + 50 + 0 + 0); // 65
    expect(rect.x).toBe(-20); // margin box starts before content
    expect(rect.y).toBe(-10);
  });
});
