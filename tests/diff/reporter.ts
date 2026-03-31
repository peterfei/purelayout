/**
 * 差分测试报告生成器
 *
 * 支持三种输出格式：文本 (text)、JSON (json)、HTML (html)
 */
import * as fs from 'fs';
import type { DiffReport, DiffResult } from './comparator.js';

// ========== 文本报告 ==========

/**
 * 生成人类可读的文本报告
 */
export function formatTextReport(report: DiffReport): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════');
  lines.push('  PureLayout 差分测试报告');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  保真度: ${report.fidelity}% (${report.passedComparisons}/${report.totalComparisons})`);
  lines.push(`  Fixtures: ${report.passedFixtures} passed, ${report.failedFixtures} failed`);
  lines.push('');

  for (const result of report.results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    lines.push(`  ${status}  ${result.fixture}`);

    for (const comp of result.comparisons) {
      if (!comp.passed) {
        lines.push(
          `        ${comp.selector} ${comp.property}: ` +
          `expected=${comp.expected}, actual=${comp.actual}, ` +
          `diff=${comp.diff.toFixed(2)} (tolerance=${comp.tolerance})`
        );
      }
    }
  }

  if (report.failedFixtures === 0) {
    lines.push('');
    lines.push('  All fixtures passed!');
  }

  return lines.join('\n');
}

// ========== JSON 报告 ==========

/**
 * 生成机器可读的 JSON 报告
 */
export function formatJsonReport(report: DiffReport): string {
  return JSON.stringify({
    generated: new Date().toISOString(),
    summary: {
      totalFixtures: report.totalFixtures,
      passedFixtures: report.passedFixtures,
      failedFixtures: report.failedFixtures,
      totalComparisons: report.totalComparisons,
      passedComparisons: report.passedComparisons,
      failedComparisons: report.failedComparisons,
      fidelity: report.fidelity,
    },
    categories: computeCategoryStats(report.results),
    fixtures: report.results.map(r => ({
      fixture: r.fixture,
      passed: r.passed,
      failures: r.comparisons.filter(c => !c.passed).map(c => ({
        selector: c.selector,
        property: c.property,
        expected: c.expected,
        actual: c.actual,
        diff: Math.round(c.diff * 100) / 100,
        tolerance: c.tolerance,
      })),
    })),
  }, null, 2);
}

// ========== HTML 可视化报告 ==========

/**
 * 生成完整的 HTML 报告（带内联样式，无需外部依赖）
 */
export function generateHtmlReport(report: DiffReport): string {
  const categories = computeCategoryStats(report.results);
  const failedFixtures = report.results.filter(r => !r.passed);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PureLayout 差分测试报告</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; background: #0d1117; color: #c9d1d9; padding: 24px; }
  .container { max-width: 960px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 8px; color: #58a6ff; }
  .meta { font-size: 12px; color: #8b949e; margin-bottom: 24px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; text-align: center; }
  .card .value { font-size: 32px; font-weight: 700; }
  .card .label { font-size: 12px; color: #8b949e; margin-top: 4px; }
  .card.pass .value { color: #3fb950; }
  .card.fail .value { color: #f85149; }
  .card.info .value { color: #58a6ff; }

  h2 { font-size: 16px; margin: 24px 0 12px; color: #c9d1d9; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: #161b22; color: #8b949e; font-weight: 600; border-bottom: 1px solid #30363d; }
  td { padding: 8px 12px; border-bottom: 1px solid #21262d; }
  tr:hover td { background: #161b22; }
  .status-pass { color: #3fb950; font-weight: 600; }
  .status-fail { color: #f85149; font-weight: 600; }
  .fixture-name { font-family: monospace; font-size: 12px; color: #c9d1d9; }
  .bar-container { display: flex; align-items: center; gap: 8px; }
  .bar { height: 8px; border-radius: 4px; background: #21262d; flex: 1; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .bar-fill.pass { background: #3fb950; }
  .bar-fill.fail { background: #f85149; }
  .bar-pct { font-size: 12px; min-width: 48px; text-align: right; color: #8b949e; }

  .failure-detail { margin-top: 16px; }
  .failure-item { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
  .failure-item .fixture-label { font-size: 13px; font-weight: 600; color: #f85149; margin-bottom: 8px; font-family: monospace; }
  .failure-item table { font-size: 12px; }
  .failure-item th { font-size: 11px; }

  .empty-state { text-align: center; padding: 32px; color: #3fb950; font-size: 14px; }
</style>
</head>
<body>
<div class="container">
  <h1>PureLayout 差分测试报告</h1>
  <div class="meta">生成时间: ${new Date().toISOString()}</div>

  <div class="summary">
    <div class="card info">
      <div class="value">${report.totalFixtures}</div>
      <div class="label">Fixtures</div>
    </div>
    <div class="card pass">
      <div class="value">${report.passedFixtures}</div>
      <div class="label">通过</div>
    </div>
    <div class="card ${report.failedFixtures > 0 ? 'fail' : 'pass'}">
      <div class="value">${report.failedFixtures}</div>
      <div class="label">失败</div>
    </div>
    <div class="card ${report.fidelity >= 99 ? 'pass' : 'fail'}">
      <div class="value">${report.fidelity}%</div>
      <div class="label">保真度</div>
    </div>
  </div>

  <h2>分类统计</h2>
  <table>
    <tr><th>分类</th><th>通过</th><th>失败</th><th>保真度</th><th></th></tr>
    ${categories.map(cat => `
    <tr>
      <td>${cat.name}</td>
      <td class="status-pass">${cat.passed}</td>
      <td class="status-fail">${cat.failed}</td>
      <td>${cat.fidelity}%</td>
      <td><div class="bar-container"><div class="bar"><div class="bar-fill ${cat.fidelity >= 99 ? 'pass' : 'fail'}" style="width:${cat.fidelity}%"></div></div><span class="bar-pct">${cat.fidelity}%</span></div></td>
    </tr>`).join('')}
  </table>

  <h2>全部 Fixtures</h2>
  <table>
    <tr><th>状态</th><th>Fixture</th><th>对比项</th><th>通过</th><th>失败</th></tr>
    ${report.results.map(r => {
      const passed = r.comparisons.filter(c => c.passed).length;
      const failed = r.comparisons.filter(c => !c.passed).length;
      return `
    <tr>
      <td class="${r.passed ? 'status-pass' : 'status-fail'}">${r.passed ? 'PASS' : 'FAIL'}</td>
      <td class="fixture-name">${r.fixture}</td>
      <td>${r.comparisons.length}</td>
      <td class="status-pass">${passed}</td>
      <td class="status-fail">${failed}</td>
    </tr>`;
    }).join('')}
  </table>

  ${failedFixtures.length > 0 ? `
  <h2>失败详情</h2>
  <div class="failure-detail">
    ${failedFixtures.map(r => `
    <div class="failure-item">
      <div class="fixture-label">${r.fixture}</div>
      <table>
        <tr><th>选择器</th><th>属性</th><th>期望值</th><th>实际值</th><th>偏差</th><th>容差</th></tr>
        ${r.comparisons.filter(c => !c.passed).map(c => `
        <tr>
          <td>${c.selector}</td>
          <td>${c.property}</td>
          <td>${c.expected}</td>
          <td>${c.actual}</td>
          <td class="status-fail">${c.diff.toFixed(2)}</td>
          <td>${c.tolerance}</td>
        </tr>`).join('')}
      </table>
    </div>`).join('')}
  </div>` : '<div class="empty-state">All fixtures passed!</div>'}
</div>
</body>
</html>`;
}

/**
 * 保存 HTML 报告到文件
 */
export function saveHtmlReport(report: DiffReport, filePath: string): void {
  const html = generateHtmlReport(report);
  fs.writeFileSync(filePath, html, 'utf-8');
}

// ========== 内部工具 ==========

interface CategoryStat {
  name: string;
  passed: number;
  failed: number;
  total: number;
  fidelity: number;
}

function computeCategoryStats(results: DiffResult[]): CategoryStat[] {
  const categories = [
    { name: 'Block', pattern: '/block/' },
    { name: 'Inline', pattern: '/inline/' },
    { name: 'BoxModel', pattern: '/box-model/' },
  ];

  return categories.map(cat => {
    const catResults = results.filter(r => r.fixture.includes(cat.pattern));
    const passed = catResults.filter(r => r.passed).length;
    const failed = catResults.length - passed;
    const fidelity = catResults.length > 0 ? Math.round((passed / catResults.length) * 1000) / 10 : 0;
    return { name: cat.name, passed, failed, total: catResults.length, fidelity };
  });
}
