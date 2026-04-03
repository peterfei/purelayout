/**
 * 差分测试 Runner
 *
 * 从 ground-truth/ 加载浏览器基准数据，与 PureLayout 输出对比。
 * 用法：npx vitest run tests/diff/diff-runner.test.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { describe, it, expect } from 'vitest';
import { layout, FallbackMeasurer, px } from '../../src/index.js';
import type { StyleNode } from '../../src/types/style.js';
import { parseCSSValue } from '../../src/css/parser.js';
import { compareLayout, generateReport, type GroundTruth, type DiffResult } from './comparator.js';
import { formatTextReport, formatJsonReport, generateHtmlReport, saveHtmlReport } from './reporter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GROUND_TRUTH_DIR = path.join(__dirname, 'ground-truth');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const REPORT_OUTPUT_DIR = path.join(__dirname, 'report');

// 全局容差配置：FallbackMeasurer 基于字符宽度表估算，与浏览器实际字体渲染存在差异
// 8px 容差覆盖 CJK 文本和行高估算误差
const TOLERANCE = 8;

const measurer = new FallbackMeasurer();

/**
 * 从 HTML fixture 构建 StyleNode 树（栈式解析器，支持嵌套）
 */
function parseHtmlToStyleNode(html: string): StyleNode {
  // 增加 overflow: hidden 以建立 BFC，匹配 capture.ts 中的 #purelayout-container 行为
  const root: StyleNode = { tagName: 'div', style: { overflow: 'hidden' }, children: [] };
  const stack: StyleNode[] = [root];

  // 移除注释
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // 用正则逐个匹配标签
  const tagRegex = /<(\/?)(\w+)((?:\s[^>]*?)?)(\/?)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    // 处理标签前的文本（保留原始空白，pre 模式需要）
    const textBefore = html.slice(lastIndex, match.index);
    if (textBefore.length > 0 && stack.length > 0) {
      stack[stack.length - 1].children.push(textBefore);
    }
    lastIndex = match.index + match[0].length;

    const isClosing = match[1] === '/';
    const tagName = match[2];
    const attrs = match[3];
    const isSelfClosing = match[4] === '/';

    if (isClosing) {
      // 闭合标签 — 弹出栈
      if (stack.length > 1) {
        stack.pop();
      }
    } else {
      const node: StyleNode = {
        tagName,
        style: parseStyleString(attrs),
        children: [],
      };
      stack[stack.length - 1].children.push(node);

      if (!isSelfClosing) {
        stack.push(node);
      }
    }
  }

  // 处理最后的文本（保留原始空白）
  const trailingText = html.slice(lastIndex);
  if (trailingText.length > 0 && stack.length > 0) {
    stack[stack.length - 1].children.push(trailingText);
  }

  // 返回根节点的第一个子节点（即 fixture 的顶层元素）
  // 忽略尾随的纯空白文本节点
  const elementChildren = root.children.filter(c => typeof c !== 'string' || c.trim().length > 0);
  if (elementChildren.length === 0) return root;
  if (elementChildren.length === 1 && typeof elementChildren[0] !== 'string') {
    return elementChildren[0] as StyleNode;
  }
  // 多个顶层元素，包裹在 div 中
  return root;
}

function parseStyleString(styleStr: string): Record<string, unknown> {
  const style: Record<string, unknown> = {};
  if (!styleStr) return style;

  // 提取 data-test-id 属性
  const testIdMatch = styleStr.match(/data-test-id="([^"]+)"/);
  if (testIdMatch) {
    style['dataTestId'] = testIdMatch[1];
  }

  const attrMatch = styleStr.match(/style="([^"]+)"/);
  const content = attrMatch ? attrMatch[1] : styleStr;

  const declarations = content.split(';').map(d => d.trim()).filter(Boolean);
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx < 0) continue;
    const prop = decl.slice(0, colonIdx).trim();
    const value = decl.slice(colonIdx + 1).trim();

    // 转换 kebab-case → camelCase
    const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

    // 展开简写属性
    if (camelProp === 'padding' || camelProp === 'margin') {
      const parts = value.split(/\s+/).filter(Boolean);
      try {
        const parsed = parts.map(p => parseCSSValue(p));
        style[`${camelProp}Top`] = parsed[0];
        style[`${camelProp}Right`] = parsed.length > 1 ? parsed[1] : parsed[0];
        style[`${camelProp}Bottom`] = parsed.length > 2 ? parsed[2] : parsed[0];
        style[`${camelProp}Left`] = parsed.length > 3 ? parsed[3] : (parsed.length > 1 ? parsed[1] : parsed[0]);
      } catch {
        // 跳过无法解析的值
      }
    } else if (camelProp === 'border') {
      // border: <width> <style> <color> — 只提取 width 部分
      const parts = value.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        try {
          const widthVal = parseCSSValue(parts[0]);
          style['borderTopWidth'] = widthVal;
          style['borderRightWidth'] = widthVal;
          style['borderBottomWidth'] = widthVal;
          style['borderLeftWidth'] = widthVal;
        } catch {
          // 跳过
        }
      }
    } else if (camelProp === 'borderTop' || camelProp === 'borderRight' ||
               camelProp === 'borderBottom' || camelProp === 'borderLeft') {
      // border-top/right/bottom/left: <width> <style> <color> — 只提取 width
      const parts = value.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        try {
          const widthVal = parseCSSValue(parts[0]);
          style[`${camelProp}Width`] = widthVal;
        } catch {
          // 跳过
        }
      }
    } else if (camelProp === 'borderWidth') {
      const parts = value.split(/\s+/).filter(Boolean);
      try {
        const parsed = parts.map(p => parseCSSValue(p));
        style['borderTopWidth'] = parsed[0];
        style['borderRightWidth'] = parsed.length > 1 ? parsed[1] : parsed[0];
        style['borderBottomWidth'] = parsed.length > 2 ? parsed[2] : parsed[0];
        style['borderLeftWidth'] = parsed.length > 3 ? parsed[3] : (parsed.length > 1 ? parsed[1] : parsed[0]);
      } catch {
        // 跳过
      }
    } else if (camelProp === 'boxSizing' || camelProp === 'display' || camelProp === 'overflow' ||
               camelProp === 'whiteSpace' || camelProp === 'wordBreak' || camelProp === 'overflowWrap' ||
               camelProp === 'textAlign' || camelProp === 'verticalAlign' || camelProp === 'textTransform' ||
               camelProp === 'flexDirection' || camelProp === 'flexWrap' || camelProp === 'justifyContent' ||
               camelProp === 'alignItems' || camelProp === 'alignSelf' || camelProp === 'alignContent' ||
               camelProp === 'gridAutoFlow' || camelProp === 'justifyItems') {
               // 枚举类型属性：直接使用字符串值
               const enumValues = new Set([
               'border-box', 'content-box', 'block', 'inline', 'inline-block', 'none', 'flex', 'grid',
               'hidden', 'visible', 'scroll', 'auto', 'normal', 'nowrap', 'pre',
               'pre-wrap', 'pre-line', 'break-all', 'break-word', 'keep-all', 'anywhere',
               'left', 'right', 'center', 'justify', 'top', 'middle', 'bottom',
               'baseline', 'uppercase', 'lowercase', 'capitalize',
               'row', 'row-reverse', 'column', 'column-reverse',
               'wrap', 'wrap-reverse',
               'flex-start', 'flex-end', 'space-between', 'space-around', 'space-evenly',
               'stretch', 'start', 'end', 'dense',
               ]);

      if (enumValues.has(value)) {
        style[camelProp] = value;
      }
    } else if (camelProp === 'flexGrow' || camelProp === 'flexShrink' || camelProp === 'order') {
      // 数值类型 flexbox 属性
      style[camelProp] = parseFloat(value);
    } else if (camelProp === 'gridTemplateColumns' || camelProp === 'gridTemplateRows' ||
               camelProp === 'gridColumn' || camelProp === 'gridRow' ||
               camelProp === 'gridColumnStart' || camelProp === 'gridColumnEnd' ||
               camelProp === 'gridRowStart' || camelProp === 'gridRowEnd' ||
               camelProp === 'gap' || camelProp === 'rowGap' || camelProp === 'columnGap') {
      // Grid 模板与定位属性：作为字符串保留，交给 cascade.ts 解析
      style[camelProp] = value;
    } else {
      try {
        style[camelProp] = parseCSSValue(value);
      } catch {
        // 跳过无法解析的值
      }
    }
  }

  return style;
}

/**
 * 加载 ground truth JSON
 */
function loadGroundTruth(relativePath: string): GroundTruth {
  const jsonPath = path.join(GROUND_TRUTH_DIR, relativePath);
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * 运行单个 fixture 的差分对比
 */
function runSingleDiff(fixtureRelPath: string): DiffResult {
  const truth = loadGroundTruth(fixtureRelPath);
  const fixtureHtmlPath = path.join(FIXTURES_DIR, fixtureRelPath.replace('.json', '.html'));
  const html = fs.readFileSync(fixtureHtmlPath, 'utf-8');

  const styleNode = parseHtmlToStyleNode(html);
  const result = layout(styleNode, {
    containerWidth: truth.container.width,
    textMeasurer: measurer,
  });

  // 查找根节点（跳过最外层自动生成的容器）
  return compareLayout(truth, result, TOLERANCE);
}

// ========== 自动生成测试用例 ==========

function loadAllGroundTruths(): string[] {
  const files: string[] = [];
  const dirs = ['block', 'inline', 'box-model', 'flex', 'grid'];

  for (const dir of dirs) {
    const dirPath = path.join(GROUND_TRUTH_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;
    const jsonFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    for (const file of jsonFiles) {
      files.push(path.join(dir, file));
    }
  }

  return files;
}

const allGroundTruths = loadAllGroundTruths();

describe('Diff: Block layout', () => {
  const blockFixtures = allGroundTruths.filter(f => f.startsWith('block/'));

  for (const fixture of blockFixtures) {
    it(fixture, () => {
      const result = runSingleDiff(fixture);

      if (!result.passed) {
        const failures = result.comparisons.filter(c => !c.passed);
        const details = failures.map(f =>
          `  ${f.selector} ${f.property}: expected=${f.expected}, actual=${f.actual}, diff=${f.diff.toFixed(2)} (tolerance=${f.tolerance})`
        ).join('\n');
        expect.fail(`${fixture} 有 ${failures.length} 项超出容差:\n${details}`);
      }

      expect(result.comparisons.length).toBeGreaterThan(0);
    });
  }
});

describe('Diff: Inline layout', () => {
  const inlineFixtures = allGroundTruths.filter(f => f.startsWith('inline/'));

  for (const fixture of inlineFixtures) {
    it(fixture, () => {
      const result = runSingleDiff(fixture);

      if (!result.passed) {
        const failures = result.comparisons.filter(c => !c.passed);
        const details = failures.map(f =>
          `  ${f.selector} ${f.property}: expected=${f.expected}, actual=${f.actual}, diff=${f.diff.toFixed(2)} (tolerance=${f.tolerance})`
        ).join('\n');
        expect.fail(`${fixture} 有 ${failures.length} 项超出容差:\n${details}`);
      }
    });
  }
});

describe('Diff: Box model', () => {
  const boxModelFixtures = allGroundTruths.filter(f => f.startsWith('box-model/'));

  for (const fixture of boxModelFixtures) {
    it(fixture, () => {
      const result = runSingleDiff(fixture);

      if (!result.passed) {
        const failures = result.comparisons.filter(c => !c.passed);
        const details = failures.map(f =>
          `  ${f.selector} ${f.property}: expected=${f.expected}, actual=${f.actual}, diff=${f.diff.toFixed(2)} (tolerance=${f.tolerance})`
        ).join('\n');
        expect.fail(`${fixture} 有 ${failures.length} 项超出容差:\n${details}`);
      }

      expect(result.comparisons.length).toBeGreaterThan(0);
    });
  }
});

describe('Diff: Flex layout', () => {
  const flexFixtures = allGroundTruths.filter(f => f.startsWith('flex/'));

  for (const fixture of flexFixtures) {
    it(fixture, () => {
      const result = runSingleDiff(fixture);

      if (!result.passed) {
        const failures = result.comparisons.filter(c => !c.passed);
        const details = failures.map(f =>
          `  ${f.selector} ${f.property}: expected=${f.expected}, actual=${f.actual}, diff=${f.diff.toFixed(2)} (tolerance=${f.tolerance})`
        ).join('\n');
        expect.fail(`${fixture} 有 ${failures.length} 项超出容差:\n${details}`);
      }

      expect(result.comparisons.length).toBeGreaterThan(0);
    });
  }
});

describe('Diff: Grid layout', () => {
  const gridFixtures = allGroundTruths.filter(f => f.startsWith('grid/'));

  for (const fixture of gridFixtures) {
    it(fixture, () => {
      const result = runSingleDiff(fixture);

      if (!result.passed) {
        const failures = result.comparisons.filter(c => !c.passed);
        const details = failures.map(f =>
          `  ${f.selector} ${f.property}: expected=${f.expected}, actual=${f.actual}, diff=${f.diff.toFixed(2)} (tolerance=${f.tolerance})`
        ).join('\n');
        expect.fail(`${fixture} 有 ${failures.length} 项超出容差:\n${details}`);
      }

      expect(result.comparisons.length).toBeGreaterThan(0);
    });
  }
});

describe('Diff: Overall fidelity report', () => {
  it('should generate fidelity report with all formats', () => {
    const allResults: DiffResult[] = [];

    for (const fixture of allGroundTruths) {
      const result = runSingleDiff(fixture);
      allResults.push(result);
    }

    const report = generateReport(allResults);

    // 文本报告
    const text = formatTextReport(report);
    console.log(`\n${text}\n`);

    // JSON 报告
    const json = formatJsonReport(report);
    console.log(`  JSON 报告长度: ${json.length} bytes`);

    // 按分类统计保真度
    const categories = [
      { name: 'Block', pattern: '/block/' },
      { name: 'Inline', pattern: '/inline/' },
      { name: 'BoxModel', pattern: '/box-model/' },
      { name: 'Flex', pattern: '/flex/' },
      { name: 'Grid', pattern: '/grid/' },
    ];
    for (const cat of categories) {
      const catResults = allResults.filter(r => r.fixture.includes(cat.pattern));
      const catPassed = catResults.filter(r => r.passed).length;
      const catTotal = catResults.length;
      const catPct = catTotal > 0 ? ((catPassed / catTotal) * 100).toFixed(1) : 'N/A';
      console.log(`  ${cat.name} fidelity: ${catPct}% (${catPassed}/${catTotal})`);
    }

    // 全量保真度断言
    expect(report.fidelity).toBe(100);
    expect(report.failedFixtures).toBe(0);

    // 生成 HTML 报告
    if (!fs.existsSync(REPORT_OUTPUT_DIR)) {
      fs.mkdirSync(REPORT_OUTPUT_DIR, { recursive: true });
    }
    saveHtmlReport(report, path.join(REPORT_OUTPUT_DIR, 'index.html'));
    console.log(`  HTML 报告已保存: tests/diff/report/index.html`);

    // 保存 JSON 报告
    fs.writeFileSync(path.join(REPORT_OUTPUT_DIR, 'report.json'), json);
    console.log(`  JSON 报告已保存: tests/diff/report/report.json`);
  });
});
