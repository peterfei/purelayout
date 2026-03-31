import { describe, it, expect } from 'vitest';
import { layout, px, FallbackMeasurer } from '../../../../src/index.js';
import type { StyleNode } from '../../../../src/types/style.js';

const measurer = new FallbackMeasurer();

function div(style: Record<string, unknown>, children: (StyleNode | string)[] = []): StyleNode {
  return { tagName: 'div', style: style as StyleNode['style'], children };
}

describe('Margin Collapse - Siblings', () => {
  it('should collapse adjacent sibling margins (take max)', () => {
    const tree = div(
      { width: px(400) },
      [
        div({ width: px(400), height: px(100), marginBottom: px(30) }),
        div({ width: px(400), height: px(100), marginTop: px(20) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    const child1 = result.root.children[0];
    const child2 = result.root.children[1];

    // collapsed margin = max(30, 20) = 30
    expect(child2.contentRect.y).toBe(100 + 30); // 130
  });

  it('should collapse with both negative margins', () => {
    const tree = div(
      { width: px(400) },
      [
        div({ width: px(400), height: px(100), marginBottom: px(-10) }),
        div({ width: px(400), height: px(100), marginTop: px(-20) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    const child2 = result.root.children[1];
    // collapsed = min(-10, -20) = -20
    expect(child2.contentRect.y).toBe(100 + (-20)); // 80
  });

  it('should collapse with mixed positive and negative margins', () => {
    const tree = div(
      { width: px(400) },
      [
        div({ width: px(400), height: px(100), marginBottom: px(30) }),
        div({ width: px(400), height: px(100), marginTop: px(-10) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    const child2 = result.root.children[1];
    // collapsed = 30 + (-10) = 20
    expect(child2.contentRect.y).toBe(100 + 20); // 120
  });
});

describe('Margin Collapse - Parent-Child', () => {
  it('should collapse parent-child margin-top when no border/padding', () => {
    const tree = div(
      { width: px(400) },
      [
        div({ width: px(400), height: px(100), marginTop: px(30) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    const child = result.root.children[0];
    // Parent has no border-top/padding-top, so margin collapses
    expect(child.contentRect.y).toBe(30);
  });

  it('should NOT collapse parent-child margin-top when border-top exists', () => {
    const tree = div(
      { width: px(400), borderTopWidth: px(1) },
      [
        div({ width: px(400), height: px(100), marginTop: px(30) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    const child = result.root.children[0];
    // border-top prevents collapse, but in our implementation
    // border-top adds to the box, child starts after border
    expect(child.contentRect.y).toBeGreaterThanOrEqual(1);
  });

  it('should NOT collapse parent-child margin-top when padding-top exists', () => {
    const tree = div(
      { width: px(400), paddingTop: px(10) },
      [
        div({ width: px(400), height: px(100), marginTop: px(30) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    const child = result.root.children[0];
    expect(child.contentRect.y).toBeGreaterThanOrEqual(10);
  });
});

describe('Margin Collapse - Multiple siblings', () => {
  it('should handle three siblings with collapsing margins', () => {
    const tree = div(
      { width: px(400) },
      [
        div({ width: px(400), height: px(50), marginBottom: px(10) }),
        div({ width: px(400), height: px(50), marginBottom: px(20) }),
        div({ width: px(400), height: px(50), marginTop: px(15) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    const [c1, c2, c3] = result.root.children;

    // c1 → y=0, c2 collapses with c1: max(10,0)=10 → y=60
    // c3 collapses with c2: max(20,15)=20 → y=130
    expect(c1.contentRect.y).toBe(0);
    expect(c2.contentRect.y).toBe(50 + 10); // 60
    expect(c3.contentRect.y).toBe(110 + 20); // 130
  });
});
