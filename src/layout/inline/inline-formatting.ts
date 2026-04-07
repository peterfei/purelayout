/**
 * Inline Formatting Context 布局 (支持对齐与精准相对坐标)
 */
import type { LayoutNode, LayoutOptions, LineBox } from '../../types/layout.js';
import type { ComputedStyle } from '../../types/style.js';
import type { TextStyle } from '../../types/text.js';
import type { WhiteSpaceValue } from '../../types/style.js';
import { resolveLength } from '../../css/cascade.js';
import { buildLineBoxes } from './line-box.js';
import { processWhitespace } from './whitespace.js';

export interface InlineRunResult {
  totalHeight: number;
  lineBoxes: LineBox[];
}

/**
 * 布局一段连续的 inline 内容
 */
export function layoutInlineRun(
  nodes: LayoutNode[],
  availableWidth: number,
  startY: number,
  options: LayoutOptions,
  startX: number = 0,
): InlineRunResult {
  const whiteSpace = getWhiteSpace(nodes);
  const fragments: Array<{ text: string; style: TextStyle; sourceIndex: number }> = [];
  const isPreMode = whiteSpace === 'pre' || whiteSpace === 'pre-wrap';

  for (const node of nodes) {
    if (node.type === 'text' && node.textContent) {
      const style = extractTextStyle(node.computedStyle);
      const processedText = processWhitespace(node.textContent, whiteSpace);
      if (processedText.length > 0) {
        if (isPreMode && processedText.includes('\\n')) {
          const lines = processedText.split('\\n');
          for (let li = 0; li < lines.length; li++) {
            if (li > 0) fragments.push({ text: '', style, sourceIndex: -1 });
            if (lines[li].length > 0) fragments.push({ text: lines[li], style, sourceIndex: node.sourceIndex });
          }
        } else {
          fragments.push({ text: processedText, style, sourceIndex: node.sourceIndex });
        }
      }
    } else if (node.type === 'inline') {
      for (const child of node.children) {
        if (child.type === 'text' && child.textContent) {
          const style = extractTextStyle(child.computedStyle);
          const processedText = processWhitespace(child.textContent, whiteSpace);
          if (processedText.length > 0) fragments.push({ text: processedText, style, sourceIndex: child.sourceIndex });
        }
      }
    }
  }

  if (fragments.length === 0) return { totalHeight: 0, lineBoxes: [] };

  // 1. 构建行框
  const lineBoxes = buildLineBoxes(fragments, availableWidth, options, whiteSpace);

  // 2. 处理文本对齐 (TextAlign)
  const textAlign = nodes[0]?.computedStyle?.inherited.textAlign || 'left';
  
  let totalHeight = 0;
  for (const lb of lineBoxes) {
    lb.y = startY + totalHeight; 
    
    // 计算对齐偏移
    let alignOffset = 0;
    if (textAlign === 'center') alignOffset = (availableWidth - lb.width) / 2;
    else if (textAlign === 'right') alignOffset = availableWidth - lb.width;
    alignOffset = Math.max(0, alignOffset);

    for (const frag of lb.fragments) {
      frag.x += startX + alignOffset; 
    }
    totalHeight += lb.height;
  }

  // 3. 计算 inline 节点自身的 contentRect
  let maxWidth = 0;
  for (const lb of lineBoxes) maxWidth = Math.max(maxWidth, lb.width);

  for (const node of nodes) {
    if (node.type === 'inline') {
      let nodeMinX = Infinity, nodeMinY = Infinity, nodeMaxY = -Infinity, nodeWidth = 0, found = false;
      for (const lb of lineBoxes) {
        for (const frag of lb.fragments) {
          let belongs = (frag.nodeIndex === node.sourceIndex);
          if (!belongs) {
            const check = (n: LayoutNode): boolean => {
              if (n.sourceIndex === frag.nodeIndex) return true;
              for (const c of n.children) if (check(c)) return true;
              return false;
            };
            belongs = check(node);
          }
          if (belongs) {
            if (!found) { nodeMinX = frag.x; nodeMinY = lb.y; found = true; }
            nodeMinX = Math.min(nodeMinX, frag.x);
            nodeMinY = Math.min(nodeMinY, lb.y);
            nodeMaxY = Math.max(nodeMaxY, lb.y + lb.height);
            nodeWidth = Math.max(nodeWidth, frag.x + frag.width);
          }
        }
      }
      if (found) {
        node.contentRect.x = nodeMinX;
        node.contentRect.y = nodeMinY;
        node.contentRect.height = nodeMaxY - nodeMinY;
        node.contentRect.width = nodeWidth - nodeMinX;
      } else {
        node.contentRect.x = startX; node.contentRect.y = startY;
        node.contentRect.height = totalHeight; node.contentRect.width = maxWidth;
      }
    }
  }
  return { totalHeight, lineBoxes };
}

function getWhiteSpace(nodes: LayoutNode[]): WhiteSpaceValue {
  for (const node of nodes) if (node.type === 'inline' && node.computedStyle) return node.computedStyle.inherited.whiteSpace as WhiteSpaceValue;
  for (const node of nodes) if (node.computedStyle) return node.computedStyle.inherited.whiteSpace as WhiteSpaceValue;
  return 'normal';
}

function extractTextStyle(computedStyle: ComputedStyle | undefined): TextStyle {
  if (!computedStyle) return { fontFamily: 'serif', fontSize: 16, fontWeight: 400, fontStyle: 'normal', letterSpacing: 0, wordSpacing: 0 };
  return {
    fontFamily: computedStyle.inherited.fontFamily,
    fontSize: resolveLength(computedStyle.inherited.fontSize),
    fontWeight: computedStyle.inherited.fontWeight,
    fontStyle: computedStyle.inherited.fontStyle as 'normal' | 'italic',
    letterSpacing: resolveLength(computedStyle.inherited.letterSpacing),
    wordSpacing: resolveLength(computedStyle.inherited.wordSpacing),
  };
}
