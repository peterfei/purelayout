/**
 * 差分测试结果比较器
 *
 * 对比 PureLayout 输出与浏览器 ground truth，计算偏差。
 */
import type { LayoutTree } from '../../src/types/layout.js';
import type { BoundingClientRect } from '../../src/types/box.js';

export interface GroundTruthElement {
  selector: string;
  rect: { x: number; y: number; width: number; height: number };
}

export interface GroundTruth {
  fixture: string;
  container: { width: number; height?: number };
  elements: GroundTruthElement[];
}

export interface DiffComparison {
  selector: string;
  property: 'x' | 'y' | 'width' | 'height';
  expected: number;
  actual: number;
  diff: number;
  tolerance: number;
  passed: boolean;
}

export interface DiffResult {
  fixture: string;
  passed: boolean;
  comparisons: DiffComparison[];
}

export interface DiffReport {
  results: DiffResult[];
  totalFixtures: number;
  passedFixtures: number;
  failedFixtures: number;
  totalComparisons: number;
  passedComparisons: number;
  failedComparisons: number;
  fidelity: number;
}

/**
 * 对比 PureLayout 输出与浏览器 ground truth
 */
export function compareLayout(
  groundTruth: GroundTruth,
  pureLayoutResult: LayoutTree,
  tolerance: number = 1,
): DiffResult {
  const comparisons: DiffComparison[] = [];
  let allPassed = true;

  for (const element of groundTruth.elements) {
    const layoutNode = findNodeByTestId(pureLayoutResult.root, element.selector);

    if (!layoutNode) {
      allPassed = false;
      continue;
    }

    const layoutRect = getBoundingClientRect(layoutNode);

    for (const prop of ['x', 'y', 'width', 'height'] as const) {
      const expected = element.rect[prop];
      const actual = layoutRect[prop];
      const diff = Math.abs(expected - actual);
      const passed = diff <= tolerance;

      if (!passed) allPassed = false;

      comparisons.push({ selector: element.selector, property: prop, expected, actual, diff, tolerance, passed });
    }
  }

  return { fixture: groundTruth.fixture, passed: allPassed, comparisons };
}

/**
 * 生成差分报告（聚合统计）
 */
export function generateReport(results: DiffResult[]): DiffReport {
  let passedFixtures = 0;
  let failedFixtures = 0;
  let passedComparisons = 0;
  let failedComparisons = 0;

  for (const result of results) {
    if (result.passed) passedFixtures++;
    else failedFixtures++;

    for (const comp of result.comparisons) {
      if (comp.passed) passedComparisons++;
      else failedComparisons++;
    }
  }

  const totalComparisons = passedComparisons + failedComparisons;
  const fidelity = totalComparisons > 0 ? (passedComparisons / totalComparisons) * 100 : 0;

  return {
    results,
    totalFixtures: results.length,
    passedFixtures,
    failedFixtures,
    totalComparisons,
    passedComparisons,
    failedComparisons,
    fidelity: Math.round(fidelity * 100) / 100,
  };
}

/**
 * 按选择器查找布局节点
 */
function findNodeByTestId(root: import('../../src/types/layout.js').LayoutNode, selector: string): import('../../src/types/layout.js').LayoutNode | null {
  const id = selector.replace(/^\[data-test-id="(.+)"\]$/, '$1');

  function search(node: import('../../src/types/layout.js').LayoutNode | null): import('../../src/types/layout.js').LayoutNode | null {
    if (!node) return null;
    if (node.testId === id) return node;
    for (const child of node.children) {
      const found = search(child);
      if (found) return found;
    }
    return null;
  }

  return search(root);
}

/**
 * 获取 BoundingClientRect（border box, 不含 margin）
 */
function getBoundingClientRect(node: import('../../src/types/layout.js').LayoutNode): BoundingClientRect {
  const { contentRect, boxModel } = node;
  const x = contentRect.x - boxModel.paddingLeft - boxModel.borderLeft;
  const y = contentRect.y - boxModel.paddingTop - boxModel.borderTop;
  const width = contentRect.width + boxModel.paddingLeft + boxModel.paddingRight
    + boxModel.borderLeft + boxModel.borderRight;
  const height = contentRect.height + boxModel.paddingTop + boxModel.paddingBottom
    + boxModel.borderTop + boxModel.borderBottom;

  return { x, y, width, height, top: y, right: x + width, bottom: y + height, left: x };
}
