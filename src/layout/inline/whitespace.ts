/**
 * 空白处理
 */
import type { WhiteSpaceValue } from '../../types/style.js';

/**
 * 根据 white-space 属性处理文本中的空白字符
 */
export function processWhitespace(text: string, whiteSpace: WhiteSpaceValue): string {
  switch (whiteSpace) {
    case 'normal':
    case 'nowrap':
      return text
        .replace(/[\n\r\t]/g, ' ')
        .replace(/ {2,}/g, ' ')
        .trim();

    case 'pre-line':
      // 保留换行符，合并其他空白，去掉行首行尾空格
      return text
        .split('\n')
        .map(line => line.replace(/[\t]/g, ' ').replace(/ {2,}/g, ' ').trim())
        .join('\n');

    case 'pre':
    case 'pre-wrap':
      return text;

    default:
      return text.replace(/[\n\r\t]/g, ' ').replace(/ {2,}/g, ' ').trim();
  }
}

/**
 * 检查给定 white-space 值是否允许软换行
 */
export function allowsSoftWrap(whiteSpace: WhiteSpaceValue): boolean {
  return whiteSpace !== 'nowrap' && whiteSpace !== 'pre';
}
