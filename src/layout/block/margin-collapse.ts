/**
 * Margin Collapse 算法
 */

/**
 * 计算两个相邻 margin 的折叠值
 *
 * - 正值取 max
 * - 负值取 min（绝对值更大的）
 * - 一正一负相加
 */
export function collapseMargins(a: number, b: number): number {
  if (a >= 0 && b >= 0) return Math.max(a, b);
  if (a < 0 && b < 0) return Math.min(a, b);
  return a + b;
}

/**
 * 检查父子 margin-top 是否可以折叠
 *
 * 不折叠条件：
 * - 父元素有 border-top
 * - 父元素有 padding-top
 * - 父元素不是 block display
 */
export function canCollapseParentChildMarginTop(
  parentComputedStyle: {
    borderTopWidth: { type: string; value?: number; unit?: string };
    paddingTop: { type: string; value?: number; unit?: string };
    display: string;
    overflow: string;
  },
): boolean {
  // 父元素有 border-top 阻止折叠
  if (
    parentComputedStyle.borderTopWidth.type === 'length' &&
    (parentComputedStyle.borderTopWidth.value ?? 0) > 0
  ) {
    return false;
  }
  // 父元素有 padding-top 阻止折叠
  if (
    parentComputedStyle.paddingTop.type === 'length' &&
    (parentComputedStyle.paddingTop.value ?? 0) > 0
  ) {
    return false;
  }
  // 父元素 display 不是 block 阻止折叠
  if (parentComputedStyle.display !== 'block') {
    return false;
  }
  return true;
}

/**
 * 检查父子 margin-bottom 是否可以折叠
 */
export function canCollapseParentChildMarginBottom(
  parentComputedStyle: {
    borderBottomWidth: { type: string; value?: number; unit?: string };
    paddingBottom: { type: string; value?: number; unit?: string };
    display: string;
  },
): boolean {
  if (
    parentComputedStyle.borderBottomWidth.type === 'length' &&
    (parentComputedStyle.borderBottomWidth.value ?? 0) > 0
  ) {
    return false;
  }
  if (
    parentComputedStyle.paddingBottom.type === 'length' &&
    (parentComputedStyle.paddingBottom.value ?? 0) > 0
  ) {
    return false;
  }
  if (parentComputedStyle.display !== 'block') {
    return false;
  }
  return true;
}
