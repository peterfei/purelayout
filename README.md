# PureLayout

<p align="center">
  <strong>纯 JavaScript/TypeScript CSS 布局计算引擎</strong><br>
  <span>不依赖浏览器 DOM，可在任意 JS 环境中运行</span>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/purelayout" alt="npm version" />
  <img src="https://img.shields.io/npm/l/purelayout" alt="license" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tests-110%20passed-brightgreen" alt="tests" />
  <img src="https://img.shields.io/badge/fidelity-100%25-brightgreen" alt="fidelity" />
  <img src="https://img.shields.io/badge/zero%20dependencies-success" alt="zero deps" />
</p>

---

## 这是什么

PureLayout 把浏览器的 **CSS Block + Inline 布局能力**从浏览器中拆出来，变成一个独立的 TypeScript 库。类比 [Pretext](https://github.com/chenglou/pretext) 把文本测量从 DOM 中拆出来的思路。

你可以在 **SSR、Web Worker、Canvas、PDF 生成、服务端渲染** 等任何有 JS 运行时的环境中精确计算 CSS 布局。

```
Pretext（文本测量） + PureLayout（布局计算） = 完整的无浏览器渲染管线
```

## 核心特性

- **零运行时依赖** — 纯 TypeScript 实现，不依赖任何浏览器 API
- **Block 布局** — BFC、normal flow、margin collapse、clearance
- **Inline 布局** — line box 构建、文本排列、软换行
- **CSS 级联** — 完整的样式级联、继承、UA 默认值
- **盒模型** — margin/padding/border/box-sizing 完整支持
- **文本测量抽象** — 可插拔的 TextMeasurer 接口，支持 Canvas 和 Fallback 两种实现
- **多环境运行** — Node.js / Browser / Worker 通用
- **双格式输出** — ESM + CJS，完整 TypeScript 类型声明
- **体积小** — 核心代码仅 ~66KB（含 source map）

## 安装

```bash
npm install purelayout
```

## 快速开始

```typescript
import { layout, getBoundingClientRect, px, FallbackMeasurer } from 'purelayout';

// 1. 定义样式节点树
const tree = {
  tagName: 'div',
  style: { width: px(400) },
  children: [
    {
      tagName: 'p',
      style: { marginTop: px(20) },
      children: ['Hello World'],
    },
    {
      tagName: 'p',
      style: { marginTop: px(30) },
      children: ['第二段文字'],
    },
  ],
};

// 2. 执行布局计算
const result = layout(tree, {
  containerWidth: 800,
  textMeasurer: new FallbackMeasurer(),
});

// 3. 读取布局结果
const first = result.root.children[0];
console.log(first.contentRect);
// { x: 0, y: 0, width: 400, height: 19.2 }

console.log(getBoundingClientRect(first));
// { x: 0, y: 0, width: 400, height: 39.2, top: 0, right: 400, bottom: 39.2, left: 0 }
```

## API

### 核心函数

| 函数 | 说明 |
|------|------|
| `layout(root, options)` | 执行布局计算，返回 `LayoutTree` |
| `getBoundingClientRect(node)` | 获取节点的 margin box 矩形（类似 DOM API） |
| `findNodeBySourceIndex(root, index)` | 按源索引查找布局节点 |

### CSS 值工厂函数

| 函数 | 返回类型 | 示例 |
|------|---------|------|
| `px(value)` | `CSSLength` | `px(100)` → `{ type: 'length', value: 100, unit: 'px' }` |
| `pct(value)` | `CSSPercentage` | `pct(50)` → `{ type: 'percentage', value: 50 }` |
| `em(value)` | `CSSRelativeLength` | `em(1.5)` → `{ type: 'em', value: 1.5 }` |
| `rem(value)` | `CSSRelativeLength` | `rem(1)` → `{ type: 'rem', value: 1 }` |
| `auto` | `CSSKeyword` | `{ type: 'keyword', value: 'auto' }` |
| `normal` | `CSSKeyword` | `{ type: 'keyword', value: 'normal' }` |
| `none` | `CSSKeyword` | `{ type: 'keyword', value: 'none' }` |

### 文本测量器

```typescript
import { FallbackMeasurer, CanvasMeasurer } from 'purelayout';

// Fallback：基于字符宽度估算，无需额外依赖
const fallback = new FallbackMeasurer();

// Canvas：使用 Node.js canvas 包，精度更高（需安装 canvas）
const canvas = new CanvasMeasurer();
```

### 样式节点类型

```typescript
interface StyleNode {
  tagName: string;                              // HTML 标签名
  style: Partial<BoxModelStyle & InheritedStyle>; // 内联样式
  children: (StyleNode | string)[];              // 子节点或文本
}
```

### 布局结果类型

```typescript
interface LayoutNode {
  contentRect: Rect;         // 内容区域 { x, y, width, height }
  boxModel: ComputedBoxModel; // 计算后的盒模型值（全部 px）
  computedStyle: ComputedStyle; // 计算后的完整样式
  children: LayoutNode[];     // 子布局节点
  lineBoxes?: LineBox[];      // 行框列表（inline 内容）
  establishesBFC: boolean;    // 是否建立新的 BFC
}
```

## 支持的 CSS 属性

### 盒模型

| 属性 | 支持的值 |
|------|---------|
| `display` | `block`, `inline`, `inline-block`, `none` |
| `box-sizing` | `content-box`, `border-box` |
| `width` / `height` | `px`, `%`, `em`, `rem`, `auto` |
| `min-width` / `max-width` | `px`, `%`, `auto`, `none` |
| `min-height` / `max-height` | `px`, `%`, `auto`, `none` |
| `margin-*` | `px`, `%`, `em`, `rem`, `auto` |
| `padding-*` | `px`, `%`, `em`, `rem` |
| `border-*-width` | `px`, `em`, `rem` |
| `overflow` | `visible`, `hidden`, `scroll`, `auto` |

### 文本

| 属性 | 支持的值 |
|------|---------|
| `font-family` | 字体名称字符串 |
| `font-size` | `px`, `em`, `rem` |
| `font-weight` | `100`-`900` |
| `font-style` | `normal`, `italic` |
| `line-height` | `px`, `%`, `em`, `rem`, `normal` |
| `color` | `#hex`, `rgb()`, `rgba()`, `hsl()` |
| `text-align` | `left`, `right`, `center`, `justify` |
| `white-space` | `normal`, `nowrap`, `pre`, `pre-wrap`, `pre-line` |
| `word-break` | `normal`, `break-all`, `keep-all` |
| `overflow-wrap` | `normal`, `break-word`, `anywhere` |
| `letter-spacing` | `px`, `em`, `rem` |
| `word-spacing` | `px`, `em`, `rem` |
| `text-indent` | `px`, `em`, `rem` |
| `text-transform` | `none`, `uppercase`, `lowercase`, `capitalize` |

### UA 默认样式

内置了常见 HTML 元素的浏览器默认样式：

`div`, `p`, `h1`-`h6`, `span`, `strong`, `em`, `a`, `ul`, `ol`, `li`, `pre`, `code`, `blockquote`, `article`, `section`, `header`, `footer`, `main`, `nav`, `aside`, `figure`, `figcaption`, `hr`, `body`, `html`, `img`

## 布局算法

### Block 布局

- **BFC 创建**：`overflow` 非 `visible`、`display: inline-block` 等条件
- **Normal Flow**：block 元素垂直堆叠，auto width 占满包含块
- **Margin Collapse**：兄弟/父子 margin 折叠，正值取 max、负值取 min、混合相加
- **Clearance**：预留接口（Phase 2 float 支持）

### Inline 布局

- **Line Box**：基于 font metrics (ascent/descent) 构建行框
- **软换行**：CJK 字符间自然断点，`word-break` / `overflow-wrap` 控制
- **空白处理**：完整支持 `white-space` 的 5 种模式

## 差分测试与保真度监控

通过 Playwright 采集浏览器真实渲染数据作为 Ground Truth，与 PureLayout 输出逐像素对比。

### 保真度总览

| 分类 | Fixtures | 通过 | 保真度 |
|------|----------|------|--------|
| Block 布局 | 11 | 11 | 100% |
| Inline 布局 | 7 | 7 | 100% |
| Box Model | 5 | 5 | 100% |
| **合计** | **23** | **23** | **100%** |

188 项对比（x/y/width/height），容差 8px（覆盖 FallbackMeasurer 字符宽度估算误差）。

### 覆盖场景

**Block:** auto-width, basic-margin, bfc-overflow, margin-collapse (siblings/parent-child/empty/mixed/negative/border-stop/padding-stop), stacking

**Inline:** basic-text, cjk-text, multi-line-text, mixed-block-inline, whitespace (normal/nowrap/pre)

**Box Model:** auto-margin-center, box-sizing (border-box/content-box), nested-padding, padding-percentage

### 运行

```bash
# 运行差分测试（自动生成文本/JSON/HTML 报告）
npm run test:diff

# 重新采集 Ground Truth（需要 Playwright）
npm run test:diff:capture

# 查看 HTML 可视化报告
open tests/diff/report/index.html
```

### 报告输出

| 格式 | 路径 | 说明 |
|------|------|------|
| 文本 | 终端输出 | ASCII 表格 + 分类统计 |
| JSON | `tests/diff/report/report.json` | 机器可读，含完整对比数据 |
| HTML | `tests/diff/report/index.html` | 暗色主题可视化，含进度条和失败详情 |

## 项目结构

```
purelayout/
├── src/
│   ├── types/              # 核心类型定义
│   │   ├── css-values.ts   # CSS 值类型系统
│   │   ├── style.ts        # StyleNode / ComputedStyle
│   │   ├── layout.ts       # LayoutNode / LayoutTree
│   │   ├── box.ts          # Rect / BoxModel / BoundingClientRect
│   │   └── text.ts         # TextMeasurer 接口
│   ├── css/                # CSS 解析与级联
│   │   ├── parser.ts       # CSS 值解析器
│   │   ├── shorthand.ts    # 简写属性展开
│   │   ├── cascade.ts      # 样式级联计算
│   │   ├── inherit.ts      # 继承属性处理
│   │   ├── initial.ts      # UA 样式表 + 初始值
│   │   └── properties.ts   # CSS 属性注册表
│   ├── layout/             # 布局引擎核心
│   │   ├── engine.ts       # layout() 主入口
│   │   ├── containing-block.ts
│   │   ├── block/          # Block 布局
│   │   │   ├── bfc.ts
│   │   │   ├── block-formatting.ts
│   │   │   ├── block-level.ts
│   │   │   ├── margin-collapse.ts
│   │   │   └── clearance.ts
│   │   ├── inline/         # Inline 布局
│   │   │   ├── inline-formatting.ts
│   │   │   ├── line-box.ts
│   │   │   ├── line-break.ts
│   │   │   └── whitespace.ts
│   │   └── resolver/       # 尺寸解析
│   ├── text/               # 文本测量
│   │   ├── measurer.ts     # 基础测量逻辑
│   │   ├── fallback-measurer.ts
│   │   └── canvas-measurer.ts
│   └── utils/format.ts     # 便捷工厂函数
├── tests/                  # 110 个测试（86 单元 + 24 差分）
│   ├── unit/               # 单元测试
│   └── diff/               # 差分测试
│       ├── capture.ts      # Playwright Ground Truth 采集
│       ├── comparator.ts   # 结果比较器
│       ├── reporter.ts     # 报告生成器 (text/json/html)
│       ├── fixtures/       # HTML 测试固件 (23 个)
│       ├── ground-truth/   # 浏览器基准数据 (23 个)
│       └── report/         # 生成的报告
└── dist/                   # 构建输出 (ESM + CJS + DTS)
```

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm run test:unit

# 差分测试（生成文本/JSON/HTML 报告）
npm run test:diff

# 类型检查
npm run lint

# 运行所有测试（watch 模式）
npm test
```

## 路线图

### Phase 1 — Block + Inline (当前)

- [x] CSS 值解析 (px/%/em/rem/auto/keyword/color)
- [x] 样式级联与继承
- [x] UA 默认样式表
- [x] Block 布局 (BFC, normal flow)
- [x] Margin Collapse
- [x] Inline 布局 (line box, 文本排列)
- [x] 软换行 (CJK, word-break, overflow-wrap)
- [x] 空白处理 (white-space 5 种模式)
- [x] 文本测量抽象 (Fallback + Canvas)
- [x] 差分测试框架 (Playwright ground truth 对比)

### Phase 2 — Flexbox

- [ ] Flex 方向 (row, column, row-reverse, column-reverse)
- [ ] Flex wrap
- [ ] justify-content / align-items / align-content
- [ ] flex-grow / flex-shrink / flex-basis
- [ ] gap

### Phase 3 — Grid

- [ ] grid-template-rows / grid-template-columns
- [ ] fr 单位
- [ ] grid-area 命名
- [ ] auto-fill / auto-fit

### Phase 4 — 定位与浮动

- [ ] position: absolute / relative / fixed / sticky
- [ ] float / clear
- [ ] z-index
- [ ] Table 布局

### 高级功能

- [x] 差分测试框架 + 保真度监控
- [ ] Pretext 适配器（精确文本测量集成）
- [ ] `@purelayout/pdf` — PDF 渲染适配器
- [ ] `@purelayout/canvas` — Canvas 渲染适配器
- [ ] `parseStyleNode(html)` — HTML 字符串快速解析

## 设计哲学

1. **不绑定渲染目标** — 输出纯数据结构（x, y, width, height），你可以渲染到任何目标
2. **渐进式实现** — 先 Block/Inline，再 Flexbox，再 Grid，按需使用
3. **浏览器即真理** — 通过差分测试持续对比浏览器渲染结果，保真度单调递增
4. **零副作用** — 不修改输入数据，可在 Worker 中安全运行

## 与现有项目对比

| 维度 | [Yoga (Meta)](https://github.com/facebook/yoga) | PureLayout |
|------|------|------------|
| 布局模型 | 仅 Flexbox | Block + Inline |
| CSS 解析 | 不解析 CSS，手动设置属性 | 支持级联、继承、默认值 |
| 实现语言 | C++ 主体，JS 绑定 | 纯 TypeScript |
| 文本处理 | 不处理文本 | 内置文本测量接口 |
| 目标场景 | React Native 跨平台 UI | SSR / PDF / Canvas / Worker |
| 维护状态 | 已停止维护 | 活跃开发中 |

## 许可证

[MIT License](./LICENSE) / [MIT 许可证](./LICENSE.zh-CN)
