import { describe, it, expect } from 'vitest';
import { layout, px, FallbackMeasurer } from '../../../../src/index.js';
import type { StyleNode } from '../../../../src/types/style.js';

const measurer = new FallbackMeasurer();

function div(style: Record<string, unknown>, children: (StyleNode | string)[] = []): StyleNode {
  return { tagName: 'div', style: style as StyleNode['style'], children };
}

describe('Grid: 基础布局 (TDD)', () => {
  it('display: grid 创建 grid 容器 (当前应回退到 block 布局，直到实现)', () => {
    const tree = div({ 
      display: 'grid', 
      width: px(400), 
      height: px(200) 
    }, [
      div({ width: px(100), height: px(50) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    
    expect(result.root.type).toBe('grid');
    expect(result.root.contentRect.width).toBe(400);
  });

  it('2x2 固定尺寸网格', () => {
    const tree = div({
      display: 'grid',
      width: px(400),
      // 模拟 gridTemplateColumns: '200px 200px'
      // 模拟 gridTemplateRows: '100px 100px'
      // 注意：目前 parser 还没支持解析字符串，所以直接传解析后的值
      gridTemplateColumns: [px(200), px(200)],
      gridTemplateRows: [px(100), px(100)],
    }, [
      div({ testId: 'item1' }),
      div({ testId: 'item2' }),
      div({ testId: 'item3' }),
      div({ testId: 'item4' }),
    ]);

    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;

    // 验证第一行
    expect(c[0].contentRect.x).toBe(0);
    expect(c[0].contentRect.y).toBe(0);
    expect(c[1].contentRect.x).toBe(200);
    expect(c[1].contentRect.y).toBe(0);

    // 验证第二行
    expect(c[2].contentRect.x).toBe(0);
    expect(c[2].contentRect.y).toBe(100);
    expect(c[3].contentRect.x).toBe(200);
    expect(c[3].contentRect.y).toBe(100);
  });

  it('fr 单位分配剩余空间', () => {
    const tree = div({
      display: 'grid',
      width: px(600),
      // 1fr 2fr -> 200px 400px
      gridTemplateColumns: [{ type: 'fr', value: 1 }, { type: 'fr', value: 2 }],
      gridTemplateRows: [px(100)],
    }, [
      div({ testId: 'item1' }),
      div({ testId: 'item2' }),
    ]);

    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;

    expect(c[0].contentRect.width).toBe(200);
    expect(c[1].contentRect.width).toBe(400);
    expect(c[1].contentRect.x).toBe(200);
  });

  it('grid gap 间距计算', () => {
    const tree = div({
      display: 'grid',
      width: px(410), // 200 + 10 + 200
      gridTemplateColumns: [px(200), px(200)],
      gridTemplateRows: [px(100), px(100)],
      gap: px(10),
    }, [
      div({ testId: 'item1' }),
      div({ testId: 'item2' }),
      div({ testId: 'item3' }),
      div({ testId: 'item4' }),
    ]);

    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;

    // 验证第一行
    expect(c[0].contentRect.x).toBe(0);
    expect(c[1].contentRect.x).toBe(210); // 200 + 10

    // 验证第二行
    expect(c[2].contentRect.y).toBe(110); // 100 + 10
    expect(c[3].contentRect.x).toBe(210);
    expect(c[3].contentRect.y).toBe(110);
    
    // 验证总高度
    expect(result.root.contentRect.height).toBe(210); // 100 + 10 + 100
  });
});
