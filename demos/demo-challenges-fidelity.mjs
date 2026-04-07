// demos/demo-challenges-fidelity.mjs
import { PPTAdapter, exportToPptx } from '../dist/index.js';
import fs from 'fs';

const THEME = {
  bg: '#050a14',
  accent: '#00f2fe',
  cardBg: '#111d2e',
  textMain: '#ffffff',
  textDim: '#94a3b8'
};

const createEmptyBox = () => ({ 
  borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0, 
  paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
  marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0
});

const createFullStyle = (overrides = {}) => ({
  boxModel: { backgroundColor: { type: 'color', value: 'transparent' }, position: 'static', ...overrides.boxModel },
  inherited: { color: { type: 'color', value: '#ffffff' }, fontSize: { type: 'length', value: 16, unit: 'px' }, fontWeight: 400, ...overrides.inherited },
  flex: {},
  grid: {}
});

const manualLayoutResult = {
  root: {
    tagName: 'div',
    type: 'block',
    contentRect: { x: 0, y: 0, width: 960, height: 540 },
    computedStyle: createFullStyle({ boxModel: { backgroundColor: { type: 'color', value: THEME.bg } } }),
    boxModel: createEmptyBox(),
    children: [
      // 标题
      {
        tagName: 'div',
        type: 'block',
        contentRect: { x: 60, y: 60, width: 800, height: 60 },
        computedStyle: createFullStyle({ inherited: { color: { type: 'color', value: THEME.accent }, fontSize: { type: 'length', value: 42, unit: 'px' }, fontWeight: 800 } }),
        boxModel: createEmptyBox(),
        lineBoxes: [{ y: 60, height: 50, width: 500, fragments: [{ x: 60, text: '当前企业面临的核心挑战', y: 60, width: 500, height: 50, baseline: 40, ascent: 40, descent: 10, nodeIndex: 0 }] }],
        children: []
      },
      // 装饰线
      {
        tagName: 'div',
        type: 'block',
        contentRect: { x: 60, y: 135, width: 840, height: 1 },
        computedStyle: createFullStyle({ boxModel: { backgroundColor: { type: 'color', value: '#1a3a4a' } } }),
        boxModel: createEmptyBox(),
        children: []
      },
      // 卡片 1
      {
        tagName: 'div',
        type: 'block',
        contentRect: { x: 60, y: 200, width: 400, height: 280 },
        computedStyle: createFullStyle({ boxModel: { backgroundColor: { type: 'color', value: THEME.cardBg } } }),
        boxModel: { ...createEmptyBox(), borderLeft: 6 },
        children: [
          {
            tagName: 'div',
            type: 'block',
            contentRect: { x: 90, y: 230, width: 340, height: 40 },
            computedStyle: createFullStyle({ inherited: { color: { type: 'color', value: '#ffffff' }, fontSize: { type: 'length', value: 28, unit: 'px' }, fontWeight: 700 } }),
            boxModel: createEmptyBox(),
            lineBoxes: [{ y: 230, height: 40, width: 340, fragments: [{ x: 90, text: '数据孤岛现象', y: 230, width: 200, height: 40, baseline: 30, ascent: 30, descent: 10, nodeIndex: 0 }] }],
            children: []
          },
          {
            tagName: 'div',
            type: 'block',
            contentRect: { x: 90, y: 290, width: 340, height: 150 },
            computedStyle: createFullStyle({ inherited: { color: { type: 'color', value: THEME.textDim }, fontSize: { type: 'length', value: 18, unit: 'px' }, fontWeight: 400 } }),
            boxModel: createEmptyBox(),
            lineBoxes: [
              { y: 290, height: 28, width: 340, fragments: [{ x: 90, text: '各部门数据系统不互通，导致信息流转', y: 290, width: 300, height: 28, baseline: 20, ascent: 20, descent: 8, nodeIndex: 0 }] },
              { y: 320, height: 28, width: 340, fragments: [{ x: 90, text: '效率低下，决策层难以获取全局视角', y: 320, width: 300, height: 28, baseline: 20, ascent: 20, descent: 8, nodeIndex: 0 }] },
              { y: 350, height: 28, width: 340, fragments: [{ x: 90, text: '的实时数据支持。', y: 350, width: 200, height: 28, baseline: 20, ascent: 20, descent: 8, nodeIndex: 0 }] }
            ],
            children: []
          }
        ]
      },
      // 卡片 2
      {
        tagName: 'div',
        type: 'block',
        contentRect: { x: 500, y: 200, width: 400, height: 280 },
        computedStyle: createFullStyle({ boxModel: { backgroundColor: { type: 'color', value: THEME.cardBg } } }),
        boxModel: { ...createEmptyBox(), borderLeft: 6 },
        children: [
          {
            tagName: 'div',
            type: 'block',
            contentRect: { x: 530, y: 230, width: 340, height: 40 },
            computedStyle: createFullStyle({ inherited: { color: { type: 'color', value: '#ffffff' }, fontSize: { type: 'length', value: 28, unit: 'px' }, fontWeight: 700 } }),
            boxModel: createEmptyBox(),
            lineBoxes: [{ y: 230, height: 40, width: 340, fragments: [{ x: 530, text: '技术集成门槛', y: 230, width: 200, height: 40, baseline: 30, ascent: 30, descent: 10, nodeIndex: 0 }] }],
            children: []
          },
          {
            tagName: 'div',
            type: 'block',
            contentRect: { x: 530, y: 290, width: 340, height: 150 },
            computedStyle: createFullStyle({ inherited: { color: { type: 'color', value: THEME.textDim }, fontSize: { type: 'length', value: 18, unit: 'px' }, fontWeight: 400 } }),
            boxModel: createEmptyBox(),
            lineBoxes: [
              { y: 290, height: 28, width: 340, fragments: [{ x: 530, text: '现有陈旧 IT 架构与新兴 AI 模型集成', y: 290, width: 300, height: 28, baseline: 20, ascent: 20, descent: 8, nodeIndex: 0 }] },
              { y: 320, height: 28, width: 340, fragments: [{ x: 530, text: '难度大，算力资源分配不均，导致技', y: 320, width: 300, height: 28, baseline: 20, ascent: 20, descent: 8, nodeIndex: 0 }] },
              { y: 350, height: 28, width: 340, fragments: [{ x: 530, text: '术创新落地缓慢。', y: 350, width: 200, height: 28, baseline: 20, ascent: 20, descent: 8, nodeIndex: 0 }] }
            ],
            children: []
          }
        ]
      }
    ]
  }
};

async function main() {
  const adapter = new PPTAdapter();
  let idx = 0;
  const assignIdx = (n) => {
    n.sourceIndex = idx++;
    n.establishesBFC = true;
    if (!n.children) n.children = [];
    n.children.forEach(assignIdx);
  };
  assignIdx(manualLayoutResult.root);

  const slide = adapter.convert(manualLayoutResult);

  // 1. H5 预览
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; }
    .canvas { width: 960px; height: 540px; background: ${THEME.bg}; position: relative; overflow: hidden; }
    .obj { position: absolute; box-sizing: border-box; }
    .text { white-space: nowrap; line-height: 1; display: flex; align-items: center; }
  </style>
</head>
<body>
  <div class="canvas">
    ${slide.objects.map(obj => {
      const style = `left:${obj.x * 96}px; top:${obj.y * 96}px; width:${obj.w * 96}px; height:${obj.h * 96}px;`;
      if (obj.type === 'rect') return `<div class="obj rect" style="${style} background:${obj.fill || 'transparent'}; border-left:${obj.border?obj.border.width:0}px solid ${obj.border?obj.border.color:'transparent'};"></div>`;
      if (obj.type === 'text') return `<div class="obj text" style="${style} color:${obj.text.color}; font-size:${obj.text.fontSize}pt; font-weight:${obj.text.bold?'bold':'normal'};">${obj.text.content}</div>`;
    }).join('\n')}
  </div>
</body>
</html>`;
  
  fs.writeFileSync('./challenges-fidelity-h5.html', html);
  await exportToPptx(slide, './challenges-fidelity.pptx');
  console.log('✅ 1:1 手动构造的 PPT 已生成。');
}

main().catch(console.error);
