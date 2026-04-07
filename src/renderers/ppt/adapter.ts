/**
 * PPT 适配器实现 (极高保真版本)
 */
import type { LayoutTree, LayoutNode } from '../../types/layout.js';
import type { PPTSlide, PPTSlideObject } from './types.js';
import { resolveLength } from '../../css/cascade.js';

// 预定义的图标映射，假设图标文件存在于某个路径下
const ICONS_MAP: Record<string, string> = {
  'icon-html': '/path/to/html_icon.png', // 占位符路径，实际使用时需要替换
  'icon-json': '/path/to/json_icon.png',
  'icon-ssr': '/path/to/ssr_icon.png',
  'icon-pdf': '/path/to/pdf_icon.png',
  'icon-canvas': '/path/to/canvas_icon.png',
};

export class PPTAdapter {
  private dpi = 96;

  pxToInches(px: number): number {
    // 强制保留 4 位小数，确保 PPT 精准对齐
    return Math.round((px / this.dpi) * 10000) / 10000;
  }

  pxToPoints(px: number): number {
    // 1px = 0.75pt (at 96dpi)
    return Math.round(px * 0.75 * 100) / 100;
  }

  convert(layoutResult: LayoutTree): PPTSlide {
    const objects: PPTSlideObject[] = [];
    
    const traverse = (node: LayoutNode) => {
      const { contentRect, computedStyle, boxModel } = node;

      // 1. 处理背景与边框 (Rect)
      const bgColor = computedStyle.boxModel.backgroundColor;
      const hasBg = bgColor && bgColor.type === 'color' && bgColor.value !== 'transparent';
      // 检查是否有实质性的边框
      const hasBorder = boxModel.borderTop > 0 || boxModel.borderRight > 0 || boxModel.borderBottom > 0 || boxModel.borderLeft > 0;
      
      if (hasBg || hasBorder) {
        const obj: PPTSlideObject = {
          type: 'rect',
          // 使用 border box 坐标 (contentRect 已经是绝对坐标了)
          x: this.pxToInches(contentRect.x - boxModel.paddingLeft - boxModel.borderLeft),
          y: this.pxToInches(contentRect.y - boxModel.paddingTop - boxModel.borderTop),
          w: this.pxToInches(contentRect.width + boxModel.paddingLeft + boxModel.paddingRight + boxModel.borderLeft + boxModel.borderRight),
          h: this.pxToInches(contentRect.height + boxModel.paddingTop + boxModel.paddingBottom + boxModel.borderTop + boxModel.borderBottom),
        };

        if (hasBg) obj.fill = bgColor!.value;
        if (hasBorder) {
          obj.border = {
            color: '#000000', // 默认黑色边框
            width: this.pxToPoints(boxModel.borderTop || 1),
          };
        }
        objects.push(obj);
      }

      // 2. 处理文字 (基于 LineBoxes 实现行级高保真排版)
      if (node.lineBoxes && node.lineBoxes.length > 0) {
        const inherited = computedStyle.inherited;
        node.lineBoxes.forEach(lb => {
          // 每个 LineBox 作为一个文本框
          const lineText = lb.fragments.map(f => f.text || '').join('');
          if (lineText.trim()) {
            // 文字 X 轴取第一个片段的 X (它已经是绝对坐标了)
            const firstFrag = lb.fragments[0];
            objects.push({
              type: 'text',
              x: this.pxToInches(firstFrag.x),
              y: this.pxToInches(lb.y),
              // 重要：宽度必须足够，否则 PPT 会强制折行
              w: this.pxToInches(lb.width + 5), 
              h: this.pxToInches(lb.height),
              text: {
                content: lineText,
                fontSize: this.pxToPoints(resolveLength(inherited.fontSize)),
                color: inherited.color.value,
                bold: inherited.fontWeight >= 700,
                align: inherited.textAlign as any,
              }
            });
          }
        });
      }

      // 3. 处理图像 (根据类名识别)
      // 遍历 ICONS_MAP，检查当前 node 的 className 是否包含任意一个 icon 的类名
      for (const iconClass in ICONS_MAP) {
        if (node.className && node.className.includes(iconClass)) {
          objects.push({
            type: 'image',
            x: this.pxToInches(contentRect.x),
            y: this.pxToInches(contentRect.y),
            w: this.pxToInches(contentRect.width),
            h: this.pxToInches(contentRect.height),
            src: ICONS_MAP[iconClass],
          });
          break; // 找到一个匹配就退出
        }
      }

      // 递归子节点
      node.children.forEach(traverse);
    };

    traverse(layoutResult.root);

    return { objects };
  }
}
