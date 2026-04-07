/**
 * PPT 高保真 H5 验证工具 (增强调试功能)
 * 
 * 读取 PPT 适配器的输出并使用 absolute 坐标在浏览器中渲染预览图。
 * 用于验证 Inches/Points 模型的转换准确性。
 */
import { layout, px, FallbackMeasurer, PPTAdapter } from '../dist/index.js';
import fs from 'fs';

// 1. 构建测试场景
// 复制 demo-ppt-complex.mjs 的布局树，但简化内容以聚焦布局问题
const PAL = {
  bg: '#020c1b',
  card: 'rgba(5, 26, 48, 0.6)',
  cardBorder: '#1e293b',
  accentBlue: '#00f2fe',
  accentGreen: '#00ffa3',
  accentPurple: '#a855f7',
  textMain: '#ffffff',
  textDim: '#94a3b8',
  l3: '#fbbf24', // Yellow
  l2: '#f97316', // Orange
  l1: '#ef4444', // Red
};

function color(val) { return { type: 'color', value: val }; }

const tree = {
  tagName: 'div',
  style: {
    width: px(960),
    height: px(540),
    backgroundColor: color(PAL.bg),
    display: 'grid',
    gridTemplateRows: '60px 100px 160px 140px 1fr', // 对应原图的 5 个区域
    padding: px(30), // 全局内边距
    gap: px(20), // 根 Grid 的行间距
  },
  children: [
    // 1. Top Bar
    {
      tagName: 'div',
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid green' }, // DEBUG
      children: [
        { tagName: 'div', style: { fontSize: px(14), fontWeight: 600, color: color(PAL.accentBlue) }, children: ['华筑智眼 - 企业级安全中枢'] },
        { tagName: 'div', style: { fontSize: px(12), color: color(PAL.textDim) }, children: ['哨兵警戒系统 (AES) 实时播报中 ●'] }
      ]
    },
    // 2. Hero Title
    {
      tagName: 'div',
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid red' }, // DEBUG
      children: [
        { 
          tagName: 'div', 
          style: { borderLeftWidth: px(4), borderColor: color(PAL.accentBlue), paddingLeft: px(15), marginBottom: px(10) },
          children: [{ tagName: 'span', style: { fontSize: px(32), fontWeight: 800 }, children: ['哨兵警戒系统 (AES)'] }]
        },
        { 
          tagName: 'div', 
          style: { fontSize: px(14), color: color(PAL.textDim) }, 
          children: ['Sentinel Alert/Eagle System • 智能预警的守护之眼'] 
        }
      ]
    },
    // 3. Feature Cards (3列 Flex)
    {
      tagName: 'div',
      style: { display: 'flex', gap: px(20), padding: px(10), border: '1px solid yellow' }, // DEBUG
      children: [
        { tagName: 'div', style: { flex: 1, backgroundColor: color(PAL.card), padding: px(15) }, children: [{ tagName: 'span', children: ['静默扫描'] }] },
        { tagName: 'div', style: { flex: 1, backgroundColor: color(PAL.card), padding: px(15) }, children: [{ tagName: 'span', children: ['智能研判'] }] },
        { tagName: 'div', style: { flex: 1, backgroundColor: color(PAL.card), padding: px(15) }, children: [{ tagName: 'span', children: ['即时响应'] }] },
      ]
    },
    // 4. Workflow Section (Flex Column)
    {
      tagName: 'div',
      style: { 
        backgroundColor: color('rgba(255,255,255,0.02)'), 
        margin: px(10), 
        padding: px(20),
        display: 'flex',
        flexDirection: 'column',
        gap: px(15),
        border: '1px solid purple', // DEBUG
      },
      children: [
        { tagName: 'div', style: { fontSize: px(14), fontWeight: 700, color: color(PAL.textMain) }, children: ['三级预警与处置流程'] },
        {
          tagName: 'div',
          style: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', border: '1px solid aqua' }, // DEBUG
          children: [
            { tagName: 'div', style: { width: px(30), height: px(30), backgroundColor: color(PAL.l3) }, children: [{ tagName: 'span', children: ['L3'] }] },
            { tagName: 'div', style: { fontSize: px(20), color: color(PAL.textDim) }, children: ['>'] },
            { tagName: 'div', style: { width: px(30), height: px(30), backgroundColor: color(PAL.l2) }, children: [{ tagName: 'span', children: ['L2'] }] },
            { tagName: 'div', style: { fontSize: px(20), color: color(PAL.textDim) }, children: ['>'] },
            { tagName: 'div', style: { width: px(30), height: px(30), backgroundColor: color(PAL.l1) }, children: [{ tagName: 'span', children: ['L1'] }] },
          ]
        }
      ]
    },
    // 5. Bottom Stats (4列 Flex)
    {
      tagName: 'div',
      style: { display: 'flex', gap: px(10), padding: px(10), border: '1px solid orange' }, // DEBUG
      children: [
        { tagName: 'div', style: { flex: 1, backgroundColor: color('rgba(255,255,255,0.03)'), padding: px(10) }, children: [{ tagName: 'span', children: ['200ms'] }] },
        { tagName: 'div', style: { flex: 1, backgroundColor: color('rgba(255,255,255,0.03)'), padding: px(10) }, children: [{ tagName: 'span', children: ['95%+'] }] },
        { tagName: 'div', style: { flex: 1, backgroundColor: color('rgba(255,255,255,0.03)'), padding: px(10) }, children: [{ tagName: 'span', children: ['0 误报'] }] },
        { tagName: 'div', style: { flex: 1, backgroundColor: color('rgba(255,255,255,0.03)'), padding: px(10) }, children: [{ tagName: 'span', children: ['24/7'] }] },
      ]
    }
  ]
};

// 2. 计算布局与转换
const result = layout(tree, { containerWidth: 960, containerHeight: 540, textMeasurer: new FallbackMeasurer() });
const adapter = new PPTAdapter();
const slide = adapter.convert(result);

// 3. 生成 H5 预览文件
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PPT Fidelity Debugger</title>
<style>
  body { background: #333; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: -apple-system, sans-serif; }
  .canvas { 
    width: 960px; height: 540px; background: white; position: relative; overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    border: 1px dashed gray; /* 模拟 PPT 边界 */
  }
  .obj { position: absolute; box-sizing: border-box; }
  .rect { border: 0px solid transparent; }
  .text { white-space: nowrap; line-height: 1.2; display: flex; align-items: center; }
  /* 调试边框 */
  .obj.text { border: 1px solid rgba(255,0,0,0.4); }
  .obj.rect { border: 1px solid rgba(0,255,0,0.4); }
</style>
</head>
<body>
<div class="canvas">
  ${slide.objects.map((obj, index) => {
    const left = obj.x * 96;
    const top = obj.y * 96;
    const width = obj.w * 96;
    const height = obj.h * 96;
    
    // DEBUG: 为每个对象添加 Title 和 data-id，方便检查
    const debugTitle = `Type: ${obj.type}
X: ${obj.x} in, Y: ${obj.y} in
W: ${obj.w} in, H: ${obj.h} in
Content: ${obj.text?.content || ''}`;

    if (obj.type === 'rect') {
      return `<div class="obj rect" data-id="obj-${index}" title="${debugTitle}" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px; background:${obj.fill || 'transparent'};"></div>`;
    } else {
      return `<div class="obj text" data-id="obj-${index}" title="${debugTitle}" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px; color:${obj.text.color}; font-size:${obj.text.fontSize}pt; font-weight:${obj.text.bold ? 'bold' : 'normal'}; justify-content:${obj.text.align === 'center' ? 'center' : (obj.text.align === 'right' ? 'flex-end' : 'flex-start')};">
        ${obj.text.content}
      </div>`;
    }
  }).join('\\n')}
</div>
</body>
</html>`;

fs.writeFileSync('debug-ppt-fidelity.html', html);
console.log('✅ H5 验证页面已生成 (增强调试): debug-ppt-fidelity.html');
console.log('请在浏览器中打开此文件，通过鼠标悬停查看每个元素的详细坐标和尺寸。');
