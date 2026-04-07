// demos/demo-purelayout-fidelity.mjs

import { layout, px, FallbackMeasurer, PPTAdapter, exportToPptx } from '../dist/index.js';
import fs from 'fs';

const PAL = {
  bg: '#020c1b', 
  textMain: '#ffffff',
  textDim: '#94a3b8',
  accentBlue: '#00f2fe',
};

const color = (val) => ({ type: 'color', value: val });

// Box Model 辅助函数 - 保持绝对定位以确保 1:1 还原
const createBoxModel = (boxX, boxY) => {
  const boxWidth = 240;
  const boxHeight = 180;

  return {
    tagName: 'div',
    style: {
      position: 'absolute',
      left: px(boxX),
      top: px(boxY),
      width: px(boxWidth),
      height: px(boxHeight),
    },
    children: [
      {
        tagName: 'div',
        style: {
          width: px(boxWidth),
          height: px(boxHeight),
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backgroundColor: color('rgba(255, 255, 255, 0.05)'),
          display: 'flex',
          padding: px(8),
        },
        children: ['Margin']
      },
      {
        tagName: 'div',
        style: {
          position: 'absolute',
          left: px(15), top: px(15),
          width: px(boxWidth - 30), height: px(boxHeight - 30),
          border: '1px solid rgba(255, 255, 255, 0.5)',
          backgroundColor: color('rgba(255, 255, 255, 0.08)'),
          display: 'flex',
          padding: px(8),
        },
        children: ['Border']
      },
      {
        tagName: 'div',
        style: {
          position: 'absolute',
          left: px(30), top: px(30),
          width: px(boxWidth - 60), height: px(boxHeight - 60),
          border: '1px solid rgba(255, 255, 255, 0.7)',
          backgroundColor: color('rgba(255, 255, 255, 0.12)'),
          display: 'flex',
          padding: px(8),
        },
        children: ['Padding']
      },
      {
        tagName: 'div',
        style: {
          position: 'absolute',
          left: px(45), top: px(45),
          width: px(boxWidth - 90), height: px(boxHeight - 90),
          border: '1px solid #ffffff',
          backgroundColor: color('rgba(255, 255, 255, 0.2)'),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
        children: ['Content']
      },
    ]
  };
};

const tree = {
  tagName: 'div',
  style: {
    width: px(960),
    height: px(540),
    backgroundColor: color(PAL.bg),
    position: 'relative',
    color: color(PAL.textMain),
    fontFamily: 'Arial',
  },
  children: [
    // 主标题区域
    {
      tagName: 'div',
      style: {
        position: 'absolute',
        width: px(960),
        top: px(160),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
      children: [
        {
          tagName: 'div',
          style: { fontSize: px(80), fontWeight: 800, marginBottom: px(10) },
          children: ['PureLayout']
        },
        {
          tagName: 'div',
          style: { fontSize: px(24), textAlign: 'center', lineHeight: px(32) },
          children: ['Revolutionizing Frontend Layout:']
        },
        {
          tagName: 'div',
          style: { fontSize: px(24), textAlign: 'center', lineHeight: px(32) },
          children: ['Cross-Platform CSS Box Model Engine']
        }
      ]
    },
    // 装饰性 Box Models
    createBoxModel(660, 40),
    createBoxModel(60, 310),

    // 图标节点
    { tagName: 'div', className: 'icon-html', style: { position: 'absolute', left: px(120), top: px(80), width: px(60), height: px(60) }, children: [] },
    { tagName: 'div', className: 'icon-json', style: { position: 'absolute', left: px(220), top: px(140), width: px(50), height: px(50) }, children: [] },
    { tagName: 'div', className: 'icon-ssr', style: { position: 'absolute', left: px(320), top: px(60), width: px(80), height: px(40) }, children: [] },
    { tagName: 'div', className: 'icon-pdf', style: { position: 'absolute', left: px(560), top: px(100), width: px(50), height: px(60) }, children: [] },
    { tagName: 'div', className: 'icon-json', style: { position: 'absolute', left: px(720), top: px(240), width: px(50), height: px(50) }, children: [] },
    { tagName: 'div', className: 'icon-html', style: { position: 'absolute', left: px(260), top: px(440), width: px(50), height: px(50) }, children: [] },
    { tagName: 'div', className: 'icon-pdf', style: { position: 'absolute', left: px(480), top: px(400), width: px(50), height: px(60) }, children: [] },
    { tagName: 'div', className: 'icon-canvas', style: { position: 'absolute', left: px(780), top: px(440), width: px(80), height: px(60) }, children: [] },
  ]
};

async function main() {
  const result = layout(tree, { containerWidth: 960, containerHeight: 540, textMeasurer: new FallbackMeasurer() });
  const adapter = new PPTAdapter();
  const slide = adapter.convert(result);

  // 1. 生成 H5 预览以便进行“红绿测试”
  const htmlPreview = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PureLayout Fidelity Preview</title>
  <style>
    body { background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .canvas { width: 960px; height: 540px; background: ${PAL.bg}; position: relative; overflow: hidden; border: 2px solid #444; }
    .obj { position: absolute; box-sizing: border-box; display: flex; align-items: center; }
    .rect { border: 1px solid rgba(255,255,255,0.2); }
    .text { white-space: nowrap; line-height: 1.2; }
    .image { background: rgba(0,242,254,0.1); border: 1px dashed #00f2fe; justify-content: center; color: #00f2fe; font-size: 10px; }
  </style>
</head>
<body>
  <div class="canvas">
    ${slide.objects.map(obj => {
      const style = `left:${obj.x * 96}px; top:${obj.y * 96}px; width:${obj.w * 96}px; height:${obj.h * 96}px;`;
      if (obj.type === 'rect') {
        return `<div class="obj rect" style="${style} background:${obj.fill || 'transparent'};"></div>`;
      } else if (obj.type === 'text') {
        return `<div class="obj text" style="${style} color:${obj.text.color}; font-size:${obj.text.fontSize}pt; font-weight:${obj.text.bold ? 'bold' : 'normal'}; justify-content:${obj.text.align === 'center' ? 'center' : 'flex-start'};">
          ${obj.text.content}
        </div>`;
      } else if (obj.type === 'image') {
        return `<div class="obj image" style="${style}">[IMAGE: ${obj.src.split('/').pop()}]</div>`;
      }
    }).join('\n')}
  </div>
</body>
</html>`;
  
  fs.writeFileSync('./purelayout_fidelity_preview.html', htmlPreview);
  console.log('✅ H5 预览文件已生成: ./purelayout_fidelity_preview.html (请在浏览器中查看以进行 1:1 校验)');

  // 2. 导出 PPTX
  const outputPath = './purelayout_fidelity.pptx';
  await exportToPptx(slide, outputPath);
  console.log(`✅ PPTX 文件已生成: ${outputPath}`);
}

main().catch(console.error);
