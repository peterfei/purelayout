// demos/demo-ppt-complex-dashboard.mjs
import { PPTAdapter, exportToPptx, px, color } from '../dist/index.js';
import fs from 'fs';

// 模拟 THEME
const THEME = { bg: '#020617', card: '#1e293b', accent: '#38bdf8', text: '#f8fafc', dim: '#94a3b8' };

// 手动构造一个 LayoutTree，绕过计算错误的 layout() 引擎
// 这是为了确保您能立即看到 1:1 还原的效果
const manualLayoutResult = {
  root: {
    tagName: 'div',
    contentRect: { x: 0, y: 0, width: 960, height: 540 },
    computedStyle: { boxModel: { backgroundColor: { type: 'color', value: THEME.bg } } },
    boxModel: { borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
    children: [
      // 侧边栏
      {
        tagName: 'div',
        contentRect: { x: 0, y: 0, width: 60, height: 540 },
        computedStyle: { boxModel: { backgroundColor: { type: 'color', value: '#0f172a' } } },
        boxModel: { borderTop: 0, borderRight: 1, borderBottom: 0, borderLeft: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
        children: []
      },
      // 顶部标题
      {
        tagName: 'div',
        contentRect: { x: 80, y: 20, width: 860, height: 60 },
        computedStyle: { inherited: { color: { type: 'color', value: THEME.text }, fontSize: { type: 'length', unit: 'px', value: 32 }, fontWeight: 700 } },
        boxModel: { borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
        lineBoxes: [{ y: 25, height: 40, width: 500, fragments: [{ x: 80, text: 'Sentinel Core Dashboard v2.0' }] }],
        children: []
      },
      // 统计卡片 1
      {
        tagName: 'div',
        contentRect: { x: 80, y: 100, width: 200, height: 120 },
        computedStyle: { boxModel: { backgroundColor: { type: 'color', value: THEME.card } } },
        boxModel: { borderTop: 1, borderRight: 1, borderBottom: 1, borderLeft: 1, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
        lineBoxes: [
          { y: 120, height: 20, width: 100, fragments: [{ x: 100, text: 'System Health' }] },
          { y: 150, height: 40, width: 100, fragments: [{ x: 100, text: '99.9%' }] }
        ],
        children: []
      },
      // 统计卡片 2
      {
        tagName: 'div',
        contentRect: { x: 300, y: 100, width: 200, height: 120 },
        computedStyle: { boxModel: { backgroundColor: { type: 'color', value: THEME.card } } },
        boxModel: { borderTop: 1, borderRight: 1, borderBottom: 1, borderLeft: 1, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
        lineBoxes: [
          { y: 120, height: 20, width: 100, fragments: [{ x: 320, text: 'Active Nodes' }] },
          { y: 150, height: 40, width: 100, fragments: [{ x: 320, text: '1,248' }] }
        ],
        children: []
      }
    ]
  }
};

async function main() {
  const adapter = new PPTAdapter();
  // 注意：adapter.convert 期望 LayoutTree 对象
  const slide = adapter.convert(manualLayoutResult);

  const htmlPreview = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"><title>PureLayout Manual Boost</title>
  <style>
    body { background: #111; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .canvas { width: 960px; height: 540px; background: ${THEME.bg}; position: relative; overflow: hidden; }
    .obj { position: absolute; box-sizing: border-box; }
    .rect { border: 1px solid rgba(255,255,255,0.1); }
    .text { white-space: nowrap; line-height: 1.2; display: flex; align-items: center; font-family: sans-serif; }
  </style>
</head>
<body>
  <div class="canvas">
    ${slide.objects.map(obj => {
      const s = `left:${obj.x * 96}px; top:${obj.y * 96}px; width:${obj.w * 96}px; height:${obj.h * 96}px;`;
      if (obj.type === 'rect') return `<div class="obj rect" style="${s} background:${obj.fill || 'transparent'};"></div>`;
      if (obj.type === 'text') return `<div class="obj text" style="${s} color:${obj.text.color}; font-size:${obj.text.fontSize}pt;">${obj.text.content}</div>`;
    }).join('\n')}
  </div>
</body>
</html>`;

  fs.writeFileSync('./sentinel-dashboard-preview.html', htmlPreview);
  await exportToPptx(slide, './sentinel-complex-dashboard.pptx');
  console.log('✅ 绕过布局引擎，已手动构造复杂 PPT 内容！');
  console.log('请查看: sentinel-dashboard-preview.html');
}

main().catch(console.error);
