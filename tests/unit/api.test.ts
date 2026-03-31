import { describe, it, expect } from 'vitest';
import { layout, findNodeBySourceIndex, px, FallbackMeasurer } from '../../src/index.js';
import type { StyleNode } from '../../src/types/style.js';

const measurer = new FallbackMeasurer();

function div(style: Record<string, unknown>, children: (StyleNode | string)[] = []): StyleNode {
  return { tagName: 'div', style: style as StyleNode['style'], children };
}

describe('Public API', () => {
  it('should export layout function', () => {
    expect(typeof layout).toBe('function');
  });

  it('should export px helper', () => {
    expect(px(100)).toEqual({ type: 'length', value: 100, unit: 'px' });
  });

  it('should export FallbackMeasurer', () => {
    expect(typeof FallbackMeasurer).toBe('function');
  });

  it('should find nodes by source index', () => {
    const tree = div(
      { width: px(400) },
      [
        div({ width: px(200), height: px(50) }),
        div({ width: px(200), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    const root = findNodeBySourceIndex(result.root, result.root.sourceIndex);
    expect(root).toBe(result.root);

    const child1 = findNodeBySourceIndex(result.root, result.root.children[0].sourceIndex);
    expect(child1).toBe(result.root.children[0]);

    const notFound = findNodeBySourceIndex(result.root, 99999);
    expect(notFound).toBeNull();
  });

  it('should layout inline text content', () => {
    const tree = div(
      { width: px(400) },
      ['Hello World']
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.children.length).toBe(1);
    expect(result.root.children[0].type).toBe('text');
    expect(result.root.children[0].textContent).toBe('Hello World');
  });

  it('should layout mixed block and text content', () => {
    const tree = div(
      { width: px(400) },
      [
        div({ width: px(400), height: px(50) }),
        'Some text',
        div({ width: px(400), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });

    expect(result.root.children.length).toBe(3);
    expect(result.root.children[0].type).toBe('block');
    expect(result.root.children[1].type).toBe('text');
    expect(result.root.children[2].type).toBe('block');
  });
});
