/**
 * Inline Formatting Context 布局
 */
import type { LayoutNode, LayoutOptions } from '../../types/layout.js';
import type { ComputedStyle } from '../../types/style.js';
import type { TextStyle } from '../../types/text.js';
import { resolveLength } from '../../css/cascade.js';
import { buildLineBoxes } from './line-box.js';

export interface InlineRunResult {
  totalHeight: number;
}

/**
 * 布局一段连续的 inline 内容
 */
export function layoutInlineRun(
  nodes: LayoutNode[],
  availableWidth: number,
  startY: number,
  options: LayoutOptions,
): InlineRunResult {
  // 收集所有内联片段
  const fragments: Array<{
    text: string;
    style: TextStyle;
    sourceIndex: number;
  }> = [];

  for (const node of nodes) {
    if (node.type === 'text' && node.textContent) {
      const style = extractTextStyle(node.computedStyle);
      fragments.push({
        text: node.textContent,
        style,
        sourceIndex: node.sourceIndex,
      });
    } else if (node.type === 'inline') {
      // inline 元素：收集其文本子节点
      for (const child of node.children) {
        if (child.type === 'text' && child.textContent) {
          const style = extractTextStyle(child.computedStyle);
          fragments.push({
            text: child.textContent,
            style,
            sourceIndex: child.sourceIndex,
          });
        }
      }
    }
  }

  if (fragments.length === 0) {
    return { totalHeight: 0 };
  }

  // 构建行框
  const lineBoxes = buildLineBoxes(fragments, availableWidth, options);

  // 计算总高度
  let totalHeight = 0;
  for (const lb of lineBoxes) {
    lb.y = startY + totalHeight;
    totalHeight += lb.height;
  }

  // 将 line boxes 关联到第一个节点
  if (nodes.length > 0) {
    const firstNode = nodes[0];
    firstNode.lineBoxes = lineBoxes;
    firstNode.contentRect.y = startY;
    firstNode.contentRect.height = totalHeight;
  }

  return { totalHeight };
}

function extractTextStyle(computedStyle: ComputedStyle | undefined): TextStyle {
  if (!computedStyle) {
    return {
      fontFamily: 'serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: 0,
      wordSpacing: 0,
    };
  }
  return {
    fontFamily: computedStyle.inherited.fontFamily,
    fontSize: resolveLength(computedStyle.inherited.fontSize),
    fontWeight: computedStyle.inherited.fontWeight,
    fontStyle: computedStyle.inherited.fontStyle as 'normal' | 'italic',
    letterSpacing: resolveLength(computedStyle.inherited.letterSpacing),
    wordSpacing: resolveLength(computedStyle.inherited.wordSpacing),
  };
}
