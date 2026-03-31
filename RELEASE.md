# PureLayout v0.1.0

> 发布日期：2026-03-31
>
> 纯 JavaScript/TypeScript CSS Block + Inline 布局计算引擎首个正式版本。

---

## 概述

PureLayout v0.1.0 实现了 CSS 正常流布局（Normal Flow）的核心子集，包括 Block 布局和 Inline 布局。该版本可以在不依赖浏览器 DOM 的前提下，精确计算元素的尺寸和位置，适用于服务端渲染、PDF 生成、Canvas 绘图等场景。

**核心数字：**

- 30 个源文件，约 1,500 行 TypeScript 代码
- 86 个单元测试，100% 通过
- 零运行时依赖
- ESM + CJS 双格式输出，完整 TypeScript 类型声明

---

## 新功能

### CSS 解析引擎

完整的 CSS 值解析与级联系统：

- **值解析器** — 支持 `px`、`%`、`em`、`rem`、`auto`、`normal`、`none`、颜色值（`#hex`、`rgb()`、`rgba()`、`hsl()`）、`calc()` 表达式
- **简写展开** — 1/2/3/4 值语法自动展开为四边值（`margin`、`padding` 等）
- **样式级联** — 完整的优先级链：用户样式 > UA 默认值 > 父元素继承值 > 属性初始值
- **相对值解析** — `em` 基于父元素 `font-size` 计算，`rem` 基于根 `font-size` 计算
- **UA 样式表** — 内置 26 种 HTML 元素的浏览器默认样式（`div`、`p`、`h1`-`h6`、`span`、`ul`、`ol`、`pre` 等）

### Block 布局

CSS Block Formatting Context (BFC) 的完整实现：

- **BFC 创建** — `overflow` 非 `visible`、`display: inline-block` 等条件触发
- **Normal Flow** — block 元素垂直堆叠，`width: auto` 占满包含块宽度
- **Margin Collapse** — 相邻兄弟 margin 折叠（正值取 max、负值取 min、一正一负相加）
- **父子 Margin Collapse** — 父元素无 `border-top`/`padding-top` 时，首/末子元素 margin 与父元素折叠
- **BFC 阻止折叠** — BFC 边界阻止内外 margin 互相折叠
- **Clearance** — 预留接口（Phase 2 float 支持时启用）

### Inline 布局

CSS Inline Formatting Context (IFC) 的基础实现：

- **Line Box 构建** — 基于 font metrics（ascent/descent）构建行框，计算行高和 baseline
- **文本排列** — 内联元素和文本节点在同一行框内水平排列
- **软换行** — CJK 字符间自然断点，`word-break` / `overflow-wrap` 控制换行策略
- **空白处理** — 完整支持 `white-space` 属性的 5 种模式：

  | 模式 | 空白合并 | 换行符 | 软换行 |
  |------|---------|--------|--------|
  | `normal` | 合并 | 忽略 | 允许 |
  | `nowrap` | 合并 | 忽略 | 禁止 |
  | `pre` | 保留 | 保留 | 禁止 |
  | `pre-wrap` | 保留 | 保留 | 允许 |
  | `pre-line` | 合并 | 保留 | 允许 |

### 盒模型

完整的 CSS 盒模型计算：

- **margin** — 四边独立设置，支持 `auto`
- **padding** — 四边独立设置，支持百分比
- **border-width** — 四边独立设置
- **box-sizing** — `content-box`（默认）和 `border-box` 模式
- **min-width / max-width / min-height / max-height** — 尺寸约束
- **水平 auto margin 居中** — `margin-left: auto` + `margin-right: auto` 平分剩余空间

### 文本测量抽象

可插拔的文本测量接口设计：

- **`TextMeasurer` 接口** — 定义 `measureTextWidth()`、`getFontMetrics()`、`measureTextSegments()` 三个方法
- **`FallbackMeasurer`** — 零依赖实现，基于字符平均宽度估算（英文 ~0.6em，CJK ~1.0em），适用于不需要精确文本测量的场景
- **`CanvasMeasurer`** — 使用 Node.js `canvas` 包的 `measureText()`，提供更高精度。当 `canvas` 包不可用时自动降级为 Fallback

---

## 公共 API

```typescript
// 布局计算
layout(root: StyleNode, options: LayoutOptions): LayoutTree

// 获取 margin box 矩形（类似 DOM getBoundingClientRect）
getBoundingClientRect(node: LayoutNode): BoundingClientRect

// 按源索引查找节点
findNodeBySourceIndex(root: LayoutNode, sourceIndex: number): LayoutNode | null

// CSS 值工厂函数
px(value: number): CSSLength
pct(value: number): CSSPercentage
em(value: number): CSSRelativeLength
rem(value: number): CSSRelativeLength
auto: CSSKeyword
normal: CSSKeyword
none: CSSKeyword

// 文本测量器
new FallbackMeasurer(): TextMeasurer
new CanvasMeasurer(): TextMeasurer
```

---

## 支持的 CSS 属性（v0.1.0）

### 盒模型属性

| 属性 | 支持的值 |
|------|---------|
| `display` | `block`, `inline`, `inline-block`, `none` |
| `box-sizing` | `content-box`, `border-box` |
| `width` / `height` | `\<length>`, `\<percentage>`, `em`, `rem`, `auto` |
| `min-*` / `max-*` | `\<length>`, `\<percentage>`, `auto`, `none` |
| `margin-*` | `\<length>`, `\<percentage>`, `em`, `rem`, `auto` |
| `padding-*` | `\<length>`, `\<percentage>`, `em`, `rem` |
| `border-*-width` | `\<length>`, `em`, `rem` |
| `overflow` | `visible`, `hidden`, `scroll`, `auto` |
| `vertical-align` | `baseline`, `top`, `middle`, `bottom` |

### 文本属性

| 属性 | 支持的值 |
|------|---------|
| `font-family` | 字体名称字符串 |
| `font-size` | `\<length>`, `em`, `rem` |
| `font-weight` | `100`-`900` |
| `font-style` | `normal`, `italic` |
| `line-height` | `\<length>`, `\<percentage>`, `em`, `rem`, `normal` |
| `color` | `#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()` |
| `text-align` | `left`, `right`, `center`, `justify` |
| `white-space` | `normal`, `nowrap`, `pre`, `pre-wrap`, `pre-line` |
| `word-break` | `normal`, `break-all`, `keep-all` |
| `overflow-wrap` | `normal`, `break-word`, `anywhere` |
| `letter-spacing` / `word-spacing` / `text-indent` | `\<length>`, `em`, `rem` |
| `text-transform` | `none`, `uppercase`, `lowercase`, `capitalize` |

---

## 已知限制

- **不支持 float** — 浮动布局将在 Phase 2 实现
- **不支持 position** — `absolute`、`fixed`、`sticky` 定位将在 Phase 2 实现
- **不支持 Flexbox** — 弹性布局将在 Phase 3 作为独立模块实现
- **不支持 Grid** — 网格布局将在 Phase 4 实现
- **不支持 Table** — 表格布局将在后续版本实现
- **文本测量精度** — `FallbackMeasurer` 基于字符平均宽度估算，存在误差。需要精确测量请使用 `CanvasMeasurer` 或集成 [Pretext](https://github.com/chenglou/pretext)
- **子像素渲染** — 当前版本所有计算基于整数像素，未处理亚像素舍入策略差异
- **Bidi** — 双向文本（阿拉伯语/希伯来语）暂不支持
- **Ruby** — Ruby 注释布局暂不支持

---

## 测试覆盖

86 个单元测试覆盖以下模块：

| 模块 | 测试文件 | 测试数量 |
|------|---------|---------|
| CSS 值解析 | `parser.test.ts` | 15 |
| 简写展开 | `shorthand.test.ts` | 5 |
| 样式级联 | `cascade.test.ts` | 12 |
| 继承属性 | `inherit.test.ts` | 6 |
| 文本测量 | `canvas-measurer.test.ts` | 7 |
| 盒模型 | `box-model.test.ts` | 5 |
| Block 布局 | `normal-flow.test.ts` | 9 |
| Margin Collapse | `margin-collapse.test.ts` | 7 |
| 空白处理 | `whitespace.test.ts` | 14 |
| 公共 API | `api.test.ts` | 6 |
| **合计** | **10 文件** | **86** |

---

## 安装与使用

```bash
npm install purelayout
```

```typescript
import { layout, getBoundingClientRect, px, FallbackMeasurer } from 'purelayout';

const result = layout(
  {
    tagName: 'div',
    style: { width: px(400), paddingTop: px(16) },
    children: [
      { tagName: 'p', style: { marginBottom: px(20) }, children: ['第一段'] },
      { tagName: 'p', style: { marginBottom: px(20) }, children: ['第二段'] },
    ],
  },
  { containerWidth: 800, textMeasurer: new FallbackMeasurer() }
);

// 读取布局结果
result.root.contentRect;        // { x: 0, y: 0, width: 400, height: ... }
result.root.children[0].contentRect;  // 第一个 <p> 的位置和尺寸
getBoundingClientRect(result.root);    // margin box 矩形
```

---

## 贡献

欢迎贡献代码、报告 Bug 或提出新功能建议。

```bash
# 克隆仓库
git clone https://github.com/your-username/purelayout.git
cd purelayout

# 安装依赖
npm install

# 运行测试
npm test

# 构建
npm run build
```

---

## 许可证

[MIT](./LICENSE)
