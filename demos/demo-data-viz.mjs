#!/usr/bin/env node
/**
 * PureLayout Data Viz Gallery — 数据可视化布局展示
 */

import { createCanvas } from 'canvas';
import { layout, px } from '../dist/index.js';
import fs from 'fs';

// ============================================================
//  全局配置
// ============================================================
const TOTAL_W = 1200;
const TOTAL_H = 1000;
const PAD = 50;

const canvas = createCanvas(TOTAL_W, TOTAL_H);
const ctx = canvas.getContext('2d');

// ============================================================
//  分词逻辑 (CJK 友好)
// ============================================================
function segmentTextLocal(text) {
  if (!text) return [];
  const segments = [];
  let current = '';
  let isWS = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    const chIsWS = ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
    const chIsCJK = (code >= 0x4e00 && code <= 0x9fff);

    if (chIsCJK) {
      if (current) segments.push({ text: current, isWhitespace: isWS });
      segments.push({ text: ch, isWhitespace: false });
      current = '';
      isWS = false;
    } else if (chIsWS !== isWS || current === '') {
      if (current) segments.push({ text: current, isWhitespace: isWS });
      current = ch;
      isWS = chIsWS;
    } else {
      current += ch;
    }
  }
  if (current) segments.push({ text: current, isWhitespace: isWS });
  return segments;
}

// ============================================================
//  本地测速器
// ============================================================
class LocalCanvasMeasurer {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this.widthCache = new Map();
  }

  buildFontString(style) {
    const styleStr = style.fontStyle === 'italic' ? 'italic' : 'normal';
    const weightStr = String(style.fontWeight || 400);
    const fontSize = typeof style.fontSize === 'number' ? style.fontSize : 14;
    return `${styleStr} ${weightStr} ${fontSize}px -apple-system, sans-serif`;
  }

  measureTextWidth(text, style) {
    if (!text) return 0;
    const font = this.buildFontString(style);
    const cacheKey = `${text}:${font}:${style.letterSpacing}`;
    if (this.widthCache.has(cacheKey)) return this.widthCache.get(cacheKey);

    this.ctx.font = font;
    const width = this.ctx.measureText(text).width + (style.letterSpacing || 0) * text.length;
    this.widthCache.set(cacheKey, width);
    return width;
  }

  getFontMetrics(style) {
    const fontSize = typeof style.fontSize === 'number' ? style.fontSize : 14;
    this.ctx.font = this.buildFontString(style);
    const metrics = this.ctx.measureText('Mxgyp');
    const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.85;
    const descent = metrics.actualBoundingBoxDescent || fontSize * 0.25;
    return { ascent, descent, lineHeight: fontSize * 1.4, emHeight: fontSize, gap: (fontSize * 0.4) / 2 };
  }

  measureTextSegments(text, style) {
    const segments = segmentTextLocal(text);
    for (const seg of segments) seg.width = this.measureTextWidth(seg.text, style);
    return segments;
  }
}

const measurer = new LocalCanvasMeasurer(canvas);

// ============================================================
//  设计系统
// ============================================================
const PAL = {
  bg: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  text: '#1e293b',
  textLight: '#64748b',
  accent: '#6366f1',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
};

// ============================================================
//  工具函数
// ============================================================
function div(style, children = []) { return { tagName: 'div', style, children }; }
function label(text, style = {}) { return { tagName: 'div', style: { display: 'block', ...style }, children: [text] }; }
function color(value) { return { type: 'color', value }; }

function roundRect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function renderLayout(layoutRoot, offsetX, offsetY) {
  const rects = [], texts = [], circles = [];

  function collect(node) {
    const cr = node.contentRect;
    const cs = node.computedStyle;
    const inherited = cs.inherited;
    const itemColor = inherited.color.value;

    const hasLineBoxes = node.lineBoxes && node.lineBoxes.length > 0;
    const hasChildren = node.children && node.children.length > 0;
    const hasSize = cr.width > 0 && cr.height > 0;

    // 当前节点的 Content Box 在画布上的绝对坐标
    // 叠加卡片自身的偏移
    const absX = offsetX + cr.x;
    const absY = offsetY + cr.y;

    if (hasSize && !hasLineBoxes && !hasChildren) {
      if (cr.width === cr.height && cr.width <= 14) {
        circles.push({ x: absX + cr.width / 2, y: absY + cr.height / 2, r: cr.width / 2, color: itemColor });
      } else {
        rects.push({ x: absX, y: absY, w: cr.width, h: cr.height, color: itemColor });
      }
    }

    if (hasLineBoxes) {
      const fontSize = typeof inherited.fontSize === 'number' ? inherited.fontSize : 14;
      node.lineBoxes.forEach(line => {
        line.fragments?.forEach(frag => {
          if (frag.text !== undefined) {
            texts.push({
              text: frag.text,
              // 注意：最新的引擎中，frag.x 已经包含在 contentRect.x 中，或者其自身就是绝对偏移（取决于 IFC 实现）
              // 但在 PureLayout 中，frag.x 是相对于 Block Container 内容区的偏移。
              // 而 contentRect.x 是绝对坐标。
              // 所以正确公式是：offsetX + frag.x
              x: offsetX + frag.x,
              y: offsetY + line.y + (frag.baseline || line.baseline),
              fontSize, fontStyle: inherited.fontStyle, fontWeight: inherited.fontWeight, color: itemColor,
            });
          }
        });
      });
    }
    node.children?.forEach(child => collect(child));
  }

  collect(layoutRoot);

  rects.forEach(r => { ctx.fillStyle = r.color; ctx.fillRect(r.x, r.y, r.w, r.h); });
  circles.forEach(c => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fillStyle = c.color; ctx.fill(); });
  texts.forEach(t => {
    ctx.fillStyle = t.color;
    ctx.font = `${t.fontStyle} ${t.fontWeight} ${t.fontSize}px -apple-system, sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(t.text, t.x, t.y);
  });
}

// ============================================================
//  场景定义
// ============================================================

function statCard(lbl, val, trnd, trndCol) {
  return div({ flex: 1, padding: px(16) }, [
    label(lbl, { fontSize: px(13), color: color(PAL.textLight), marginBottom: px(8) }),
    label(val, { fontSize: px(28), fontWeight: 700, color: color(PAL.text) }),
    label(trnd, { fontSize: px(13), fontWeight: 600, color: color(trndCol), marginTop: px(8) }),
  ]);
}

function chartBox(title, desc) {
  return div({ flex: 1, padding: px(16) }, [
    label(title, { fontWeight: 600, fontSize: px(14), marginBottom: px(12) }),
    div({ height: px(60), color: color('#f1f5f9') }, []),
    label(desc, { fontSize: px(12), color: color(PAL.textLight), marginTop: px(12) }),
  ]);
}

function legendItem(lbl, dotCol) {
  return div({ display: 'flex', alignItems: 'center', gap: px(10), flexShrink: 0 }, [
    div({ width: px(12), height: px(12), color: color(dotCol) }, []),
    label(lbl, { fontSize: px(14), whiteSpace: 'nowrap' }),
  ]);
}

function progressBar(lbl, pctVal, barCol) {
  return div({ marginBottom: px(24), padding: px(12) }, [
    div({ display: 'flex', justifyContent: 'space-between', marginBottom: px(10) }, [
      label(lbl, { fontSize: px(14), fontWeight: 600 }),
      label(`${pctVal}%`, { fontSize: px(14) }),
    ]),
    div({ height: px(10), color: color('#e2e8f0') }, [
      div({ width: px(pctVal * 4.5), height: px(10), color: color(barCol) }, []),
    ]),
  ]);
}

function timelineItem(title, time, hasLine) {
  return div({ display: 'flex', gap: px(24) }, [
    div({ display: 'flex', flexDirection: 'column', alignItems: 'center', width: px(16) }, [
      div({ width: px(14), height: px(14), marginTop: px(4), color: color(PAL.accent) }, []),
      hasLine ? div({ flex: 1, width: px(2), marginTop: px(6), marginBottom: px(6), color: color('#cbd5e1') }, []) : div({}, []),
    ]),
    div({ flex: 1, paddingBottom: px(40) }, [
      label(title, { fontWeight: 600, fontSize: px(15), color: color(PAL.text), lineHeight: px(22) }),
      label(time, { fontSize: px(12), color: color(PAL.textLight), marginTop: px(6) }),
    ]),
  ]);
}

function tableRow(cols, valCol, fWeight, fSize) {
  return div({ display: 'flex', padding: px(14), borderBottomWidth: px(1) },
    cols.map((c, i) => div({ flex: i === 0 ? 2 : 1 }, [
      label(c, { fontSize: px(fSize), fontWeight: fWeight, color: (i === 2 && fWeight === 400) ? color(valCol) : color(PAL.text) })
    ]))
  );
}

// ============================================================
//  主流程
// ============================================================

ctx.fillStyle = PAL.bg;
ctx.fillRect(0, 0, TOTAL_W, TOTAL_H);

ctx.fillStyle = PAL.text;
ctx.font = 'bold 36px -apple-system, sans-serif';
ctx.fillText('PureLayout Dashboard', PAD, 60);
ctx.font = '16px -apple-system, sans-serif';
ctx.fillStyle = PAL.textLight;
ctx.fillText('Professional Data Visualization Layout Engine (No Browser DOM Required)', PAD, 90);

const scenes = [
  { tree: div({ width: px(500) }, [ div({ display: 'flex', gap: px(16) }, [ statCard('Revenue', '$124,563', '+12.5%', PAL.success), statCard('Active Users', '8,429', '+8.2%', PAL.success) ]) ]), x: PAD, y: 140, title: 'Real-time Metrics' },
  { tree: div({ width: px(500) }, [ div({ display: 'flex', gap: px(16) }, [ chartBox('Sales Trend', '📈 Consistent daily growth'), chartBox('Traffic Source', 'Direct leads social') ]) ]), x: TOTAL_W/2+PAD/2, y: 140, title: 'Trend Analysis' },
  { tree: div({ width: px(500) }, [ div({ display: 'flex', flexWrap: 'wrap', gap: px(24), padding: px(16) }, [ legendItem('Alpha', PAL.accent), legendItem('Beta', PAL.success), legendItem('Gamma', PAL.warning), legendItem('Delta', PAL.danger) ]) ]), x: PAD, y: 440, title: 'Market Segmentation' },
  { tree: div({ width: px(500) }, [ progressBar('Annual Target', 78, PAL.accent), progressBar('Quarterly Goal', 45, PAL.success) ]), x: TOTAL_W/2+PAD/2, y: 440, title: 'Strategic Goals' },
  { tree: div({ width: px(500) }, [ div({ display: 'flex', flexDirection: 'column', padding: px(8) }, [ timelineItem('Order confirmed', 'Just now', true), timelineItem('Security alert', '15 mins ago', true), timelineItem('Backup done', '2 hours ago', false) ]) ]), x: PAD, y: 740, title: 'Audit Log' },
  { tree: div({ width: px(500) }, [ tableRow(['Asset', 'Value', 'Change'], PAL.textLight, 700, 12), tableRow(['BTC', '$68K', '+4%'], PAL.success, 400, 14), tableRow(['ETH', '$3K', '+2%'], PAL.success, 400, 14) ]), x: TOTAL_W/2+PAD/2, y: 740, title: 'Asset List' },
];

scenes.forEach(scene => {
  const { x, y } = scene;
  ctx.fillStyle = PAL.card;
  roundRect(x, y, 550, 280, 12);
  ctx.fill();
  ctx.strokeStyle = PAL.cardBorder;
  ctx.lineWidth = 1;
  roundRect(x, y, 550, 280, 12);
  ctx.stroke();
  ctx.fillStyle = PAL.accent;
  ctx.font = 'bold 12px -apple-system, sans-serif';
  ctx.fillText(scene.title.toUpperCase(), x + 24, y + 28);

  const result = layout(scene.tree, { containerWidth: 502, textMeasurer: measurer });
  renderLayout(result.root, x + 24, y + 54);
});

const outPath = new URL('demo-data-viz.png', import.meta.url).pathname;
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`Demo Finalized: ${outPath}`);
