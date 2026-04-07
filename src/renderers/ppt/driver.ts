/**
 * PptxGenJS 驱动实现
 * 
 * 将 PPTSlide 模型转换为真实的 .pptx 文件
 */
import type { PPTSlide } from './types.js';

export async function exportToPptx(slideData: PPTSlide, outputPath: string) {
  // 动态导入，避免强制依赖
  let PptxGenJS;
  try {
    const module = await import('pptxgenjs');
    PptxGenJS = module.default;
  } catch (err) {
    throw new Error('Please install "pptxgenjs" to use the PPT renderer: npm install pptxgenjs');
  }

  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();

  for (const obj of slideData.objects) {
    if (obj.type === 'rect') {
      const { color, transparency } = parseColorToPptx(obj.fill || '#FFFFFF');
      slide.addShape(pptx.ShapeType.rect, {
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
        fill: { color, transparency },
      });
    } else if (obj.type === 'text' && obj.text) {
      const { color } = parseColorToPptx(obj.text.color);
      slide.addText(obj.text.content, {
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
        fontSize: obj.text.fontSize,
        color: color,
        bold: obj.text.bold,
        align: obj.text.align,
        valign: 'middle',
        wrap: false, // 禁用自动换行，严格遵循 PureLayout 宽度
      });
    } else if (obj.type === 'image' && obj.src) { // 添加 image 处理逻辑
      slide.addImage({
        path: obj.src,
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
      });
    }
  }

  await pptx.writeFile({ fileName: outputPath });
}
function parseColorToPptx(cssColor: string): { color: string; transparency: number } {
  if (cssColor.startsWith('#')) {
    return { color: cssColor.replace('#', ''), transparency: 0 };
  }
  
  if (cssColor.startsWith('rgba')) {
    const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      const a = match[4] ? parseFloat(match[4]) : 1;
      // PPT transparency: 0-100 (0 is opaque, 100 is transparent)
      return { 
        color: `${r}${g}${b}`.toUpperCase(), 
        transparency: Math.round((1 - a) * 100) 
      };
    }
  }

  return { color: 'FFFFFF', transparency: 0 };
}
