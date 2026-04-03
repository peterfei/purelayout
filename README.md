# PureLayout

<p align="center">
  <strong>纯 JavaScript/TypeScript CSS 布局计算引擎</strong><br>
  <span>不依赖浏览器 DOM，可在任意 JS 环境中运行</span>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/purelayout" alt="npm version" />
  <img src="https://img.shields.io/npm/l/purelayout" alt="license" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tests-212%20passed-brightgreen" alt="tests" />
  <img src="https://img.shields.io/badge/fidelity-100%25-brightgreen" alt="fidelity" />
  <img src="https://img.shields.io/badge/zero%20dependencies-success" alt="zero deps" />
</p>

---

## 这是什么

PureLayout 把浏览器的 **CSS Block + Inline + Flexbox + Grid 布局能力**从浏览器中拆出来，变成一个独立的 TypeScript 库。类比 [Pretext](https://github.com/chenglou/pretext) 把文本测量从 DOM 中拆出来的思路。

你可以在 **SSR、Web Worker、Canvas、PDF 生成、服务端渲染、高保真 PPT/H5** 等任何有 JS 运行时的环境中精确计算 CSS 布局。

```
Pretext（文本测量） + PureLayout（布局计算） = 完整的无浏览器渲染管线
```

## 核心特性

- **零运行时依赖** — 纯 TypeScript 实现，不依赖任何浏览器 API
- **Grid 布局** — 轨道尺寸计算（px/fr/%）、repeat()、自动放置、显式定位
- **Flexbox 布局** — 完整 Flex Formatting Context，支持 grow/shrink/wrap/对齐
- **Block 布局** — BFC、normal flow、margin collapse、clearance
- **Inline 布局** — line box 构建、文本排列、软换行
- **CSS 级联** — 完整的样式级联、继承、UA 默认值
- **盒模型** — margin/padding/border/box-sizing 完整支持
- **多环境运行** — Node.js / Browser / Worker 通用
- **高保真度** — 100% 通过差分测试，与浏览器像素级对齐

## 安装

```bash
npm install purelayout
```

## 快速开始

```typescript
import { layout, px, FallbackMeasurer } from 'purelayout';

// 1. 定义 Grid 布局树
const tree = {
  tagName: 'div',
  style: { 
    display: 'grid', 
    gridTemplateColumns: '100px 1fr', 
    gap: px(20) 
  },
  children: [
    { tagName: 'div', style: { height: px(50) }, children: ['Sidebar'] },
    { tagName: 'div', style: { height: px(50) }, children: ['Content'] },
  ],
};

// 2. 执行布局计算
const result = layout(tree, {
  containerWidth: 800,
  textMeasurer: new FallbackMeasurer(),
});

// 3. 读取布局结果
console.log(result.root.children[1].contentRect);
// { x: 120, y: 0, width: 680, height: 50 }
```

## 支持的 CSS 属性

### 盒模型

| 属性 | 支持的值 |
|------|---------|
| `display` | `block`, `inline`, `inline-block`, `flex`, `grid`, `none` |
| `box-sizing` | `content-box`, `border-box` |
| `width` / `height` | `px`, `%`, `em`, `rem`, `auto` |
| `gap` / `row-gap` / `column-gap` | `px`, `em`, `rem`, `normal` |

### Grid (新)

| 属性 | 支持的值 |
|------|---------|
| `grid-template-columns` | `px`, `%`, `fr`, `repeat()`, `auto` |
| `grid-template-rows` | `px`, `%`, `auto` |
| `grid-column` / `grid-row` | shorthand (e.g., `1 / 3`) |
| `grid-column-start/end` | `<integer>`, `auto` |
| `grid-row-start/end` | `<integer>`, `auto` |

### Flexbox

| 属性 | 支持的值 |
|------|---------|
| `flex-direction` | `row`, `row-reverse`, `column`, `column-reverse` |
| `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse` |
| `justify-content` | `flex-start`, `flex-end`, `center`, `space-between`, `space-around`, `space-evenly` |
| `flex-grow` / `flex-shrink` / `flex-basis` | 完整支持 |

## 演示

运行 `npm run demo` 查看所有演示效果。

### 数据可视化

展示仪表盘网格、统计卡片、图表容器等（由 Grid + Flex 驱动）。

<img src="demos/demo-data-viz.png" alt="数据可视化布局演示" width="800" />

## 布局算法

### 100% 浏览器保真度

通过 Playwright 采集浏览器真实渲染数据作为 Ground Truth，与 PureLayout 输出逐像素对比。

| 分类 | Fixtures | 通过 | 保真度 |
|------|----------|------|--------|
| Block 布局 | 11 | 11 | 100% |
| Inline 布局 | 7 | 7 | 100% |
| Box Model | 5 | 5 | 100% |
| Flex 布局 | 25 | 25 | 100% |
| Grid 布局 | 4 | 4 | 100% |
| **合计** | **52** | **52** | **100%** |

## 路线图

### Phase 3 — Grid (进行中)

- [x] grid-template-rows / grid-template-columns
- [x] fr 弹性单位
- [x] repeat() 函数解析
- [x] grid-column / grid-row 显式定位 (Span)
- [ ] grid-area 命名区域
- [ ] auto-fill / auto-fit 弹性平铺
- [x] 100% 浏览器保真度 (基础)

### Phase 4 — 定位与浮动

- [ ] position: absolute / relative / fixed / sticky
- [ ] float / clear
- [ ] z-index
- [ ] Table 布局

### 高级功能

- [x] 差分测试框架 + 保真度监控
- [x] Pretext 适配器 (精确文本测量集成)
- [ ] `@purelayout/pdf` — PDF 渲染适配器
- [ ] `@purelayout/canvas` — Canvas 渲染适配器
- [ ] `parseStyleNode(html)` — HTML 字符串快速解析

## 许可证

[MIT License](./LICENSE)
