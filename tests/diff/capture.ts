/**
 * Playwright Ground Truth 采集脚本
 *
 * 使用方法：
 *   npx tsx tests/diff/capture.ts
 *   npx tsx tests/diff/capture.ts --fixture tests/diff/fixtures/block/basic-margin.html
 *
 * 采集结果保存到 tests/diff/ground-truth/ 目录。
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface CapturedElement {
  selector: string;
  rect: { x: number; y: number; width: number; height: number };
}

interface GroundTruth {
  fixture: string;
  container: { width: number; height?: number };
  elements: CapturedElement[];
}

const CONTAINER_WIDTH = 800;

function wrapInContainer(html: string, width: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; }
  body { font-family: serif; font-size: 16px; }
  #purelayout-container {
    width: ${width}px;
    position: relative;
    overflow: hidden;
  }
</style>
</head>
<body>
<div id="purelayout-container">${html}</div>
</body>
</html>`;
}

async function captureFixture(fixturePath: string): Promise<GroundTruth> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const html = fs.readFileSync(fixturePath, 'utf-8');
  await page.setContent(wrapInContainer(html, CONTAINER_WIDTH));

  const elements = await page.evaluate(() => {
    const results: CapturedElement[] = [];
    const allElements = document.querySelectorAll('[data-test-id]');

    for (const el of allElements) {
      const rect = el.getBoundingClientRect();
      results.push({
        selector: `[data-test-id="${el.getAttribute('data-test-id')}"]`,
        rect: {
          x: Math.round(rect.x * 100) / 100,
          y: Math.round(rect.y * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
        },
      });
    }

    return results;
  });

  await browser.close();

  return {
    fixture: path.relative(path.join(__dirname, '..'), fixturePath),
    container: { width: CONTAINER_WIDTH },
    elements,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const fixturesDir = path.join(__dirname, 'fixtures');
  const outputDir = path.join(__dirname, 'ground-truth');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let fixtureFiles: string[];

  if (args.length > 0 && !args[0].startsWith('--')) {
    fixtureFiles = args.map(f => path.resolve(f));
  } else {
    fixtureFiles = [];
    const dirs = ['block', 'inline', 'box-model', 'flex', 'grid'];
    for (const dir of dirs) {
      const dirPath = path.join(fixturesDir, dir);
      if (!fs.existsSync(dirPath)) continue;
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));
      for (const file of files) {
        fixtureFiles.push(path.join(dirPath, file));
      }
    }
  }

  console.log(`\n  Capturing ground truth for ${fixtureFiles.length} fixtures...\n`);

  for (const fixturePath of fixtureFiles) {
    if (!fs.existsSync(fixturePath)) {
      console.log(`  SKIP  ${fixturePath} (not found)`);
      continue;
    }

    try {
      const truth = await captureFixture(fixturePath);
      const relativeName = path.relative(fixturesDir, fixturePath).replace('.html', '.json');
      const outputPath = path.join(outputDir, relativeName);
      const outputDirForFile = path.dirname(outputPath);

      if (!fs.existsSync(outputDirForFile)) {
        fs.mkdirSync(outputDirForFile, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(truth, null, 2));

      const status = truth.elements.length > 0 ? 'OK' : 'WARN (no elements)';
      console.log(`  ${status.padEnd(6)} ${path.relative(fixturesDir, fixturePath)} (${truth.elements.length} elements)`);
    } catch (err) {
      console.log(`  FAIL  ${fixturePath}: ${err}`);
    }
  }

  console.log(`\n  Done. Ground truth saved to tests/diff/ground-truth/\n`);
}

main().catch(console.error);
