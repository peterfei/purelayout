/**
 * PureLayout 复杂 PPT 导出演示 — 企业级安全中枢
 * 
 * 展示如何利用 Grid + Flex 嵌套实现高度复杂的商业幻灯片排版
 */
import { layout, px, FallbackMeasurer, PPTAdapter } from '../dist/index.js';
import fs from 'fs';

// ============================================================
//  设计系统 (Sentinel Dark Theme)
// ============================================================
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

// ============================================================
//  组件定义
// ============================================================

function featureCard(title, iconColor, desc) {
  return {
    tagName: 'div',
    style: {
      flex: 1,
      backgroundColor: color(PAL.card),
      padding: px(24),
      borderTopWidth: px(1),
      borderColor: color(iconColor),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: px(12),
    },
    children: [
      { 
        tagName: 'div', 
        style: { width: px(40), height: px(40), backgroundColor: color(iconColor), borderRadius: px(20), marginBottom: px(8) },
        children: [] 
      },
      { 
        tagName: 'div', 
        style: { fontSize: px(18), fontWeight: 700, color: color(iconColor) }, 
        children: [title] 
      },
      { 
        tagName: 'div', 
        style: { fontSize: px(11), color: color(PAL.textDim), textAlign: 'center', lineHeight: px(16) }, 
        children: [desc] 
      }
    ]
  };
}

function workflowStep(level, labelText, desc, stepColor) {
  return {
    tagName: 'div',
    style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(8) },
    children: [
      { 
        tagName: 'div', 
        style: { width: px(32), height: px(32), backgroundColor: color(stepColor), borderRadius: px(16), display: 'flex', alignItems: 'center', justifyContent: 'center' },
        children: [{ tagName: 'span', style: { color: color('#000000'), fontWeight: 800, fontSize: px(14) }, children: [level] }] 
      },
      { tagName: 'div', style: { fontSize: px(14), fontWeight: 700, color: color(stepColor) }, children: [labelText] },
      { tagName: 'div', style: { fontSize: px(10), color: color(PAL.textDim), textAlign: 'center' }, children: [desc] }
    ]
  };
}

function statBox(val, labelText) {
  return {
    tagName: 'div',
    style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: px(16), backgroundColor: color('rgba(255,255,255,0.03)') },
    children: [
      { tagName: 'div', style: { fontSize: px(28), fontWeight: 700, color: color(PAL.accentBlue) }, children: [val] },
      { tagName: 'div', style: { fontSize: px(11), color: color(PAL.textDim), marginTop: px(4) }, children: [labelText] }
    ]
  };
}

// ============================================================
//  主布局树 (960x540)
// ============================================================
const tree = {
  tagName: 'div',
  style: {
    width: px(960),
    height: px(540),
    backgroundColor: color(PAL.bg),
    display: 'grid',
    gridTemplateRows: '60px 100px 160px 140px 1fr',
    padding: px(30),
  },
  children: [
    // 1. Top Bar
    {
      tagName: 'div',
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
      children: [
        { tagName: 'div', style: { fontSize: px(14), fontWeight: 600, color: color(PAL.accentBlue) }, children: ['华筑智眼 - 企业级安全中枢'] },
        { tagName: 'div', style: { fontSize: px(12), color: color(PAL.textDim) }, children: ['哨兵警戒系统 (AES) 实时播报中 ●'] }
      ]
    },
    // 2. Hero Title
    {
      tagName: 'div',
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
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
    // 3. Feature Cards
    {
      tagName: 'div',
      style: { display: 'flex', gap: px(20), padding: px(10) },
      children: [
        featureCard('静默扫描', PAL.accentBlue, '7×24 小时持续监控，零干扰智能巡检。系统在后台静默运行，实时分析视频流。'),
        featureCard('智能研判', PAL.accentPurple, '三级漏斗推理模型，YOLO 快速初筛 + VLM 语义精审，准确率突破 95%。'),
        featureCard('即时响应', PAL.accentGreen, '毫秒级报告推送，多通道触达。从风险发现到责任人接收，全程响应时间 < 500ms'),
      ]
    },
    // 4. Workflow Section
    {
      tagName: 'div',
      style: { 
        backgroundColor: color('rgba(255,255,255,0.02)'), 
        margin: px(10), 
        padding: px(20),
        display: 'flex',
        flexDirection: 'column',
        gap: px(15)
      },
      children: [
        { tagName: 'div', style: { fontSize: px(14), fontWeight: 700, color: color(PAL.textMain) }, children: ['三级预警与处置流程'] },
        {
          tagName: 'div',
          style: { display: 'flex', alignItems: 'center', justifyContent: 'space-around' },
          children: [
            workflowStep('L3', '项目部预警', '现场实时处置\n即时整改', PAL.l3),
            { tagName: 'div', style: { fontSize: px(24), color: color(PAL.textDim) }, children: ['>'] },
            workflowStep('L2', '分公司监管', '跨项目统筹\n重点督办', PAL.l2),
            { tagName: 'div', style: { fontSize: px(24), color: color(PAL.textDim) }, children: ['>'] },
            workflowStep('L1', '工程局决策', '全局态势感知\n战略部署', PAL.l1),
          ]
        }
      ]
    },
    // 5. Bottom Stats
    {
      tagName: 'div',
      style: { display: 'flex', gap: px(10), padding: px(10) },
      children: [
        statBox('200ms', '平均检测延迟'),
        statBox('95%+', '研判准确率'),
        statBox('0 误报', '经过二级过滤'),
        statBox('24/7', '全天候守护'),
      ]
    }
  ]
};

// ============================================================
//  执行导出
// ============================================================

async function run() {
  console.log('🚀 正在启动企业级 PPT 渲染管线...');
  
  const result = layout(tree, {
    containerWidth: 960,
    containerHeight: 540,
    textMeasurer: new FallbackMeasurer(),
  });

  console.log('📦 布局计算完成，正在执行矢量模型转换...');
  const adapter = new PPTAdapter();
  const slideData = adapter.convert(result);

  const outPath = 'sentinel-complex-dashboard.pptx';
  
  try {
    const { exportToPptx } = await import('../dist/index.js');
    await exportToPptx(slideData, outPath);
    console.log(`\n✨ ✅ PPT 导出成功: ${outPath}`);
    console.log('💡 每一个图表、文字、背景块在 PPT 中均可独立编辑。');
  } catch (err) {
    console.error('❌ 导出失败:', err.message);
    fs.writeFileSync('complex-ppt-model.json', JSON.stringify(slideData, null, 2));
    console.log('已降级生成模型文件: complex-ppt-model.json');
  }
}

run();
