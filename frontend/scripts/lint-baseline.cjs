const fs = require('node:fs');
const path = require('node:path');
const { ESLint } = require('eslint');

const root = path.resolve(__dirname, '..');
const baselinePath = path.join(__dirname, 'lint-baseline.json');

function countFindings(results) {
  const counts = {};
  for (const result of results) {
    const file = path.relative(root, result.filePath).replace(/\\/g, '/');
    const lines = fs.readFileSync(result.filePath, 'utf8').split(/\r?\n/);
    for (const finding of result.messages) {
      const source = (lines[finding.line - 1] || '').trim();
      const key = JSON.stringify([file, finding.ruleId, finding.message, source]);
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return counts;
}

async function main() {
  const eslint = new ESLint({ cwd: root, extensions: ['.js', '.jsx'] });
  const results = await eslint.lintFiles(['.']);
  const counts = countFindings(results);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  if (process.argv.includes('--update-baseline')) {
    fs.writeFileSync(baselinePath, `${JSON.stringify(counts, null, 2)}\n`);
    console.log(`Recorded ${total} existing lint findings.`);
    return;
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const newFindings = Object.entries(counts)
    .filter(([key, count]) => count > (baseline[key] || 0));

  if (newFindings.length) {
    console.error(`${newFindings.length} new lint finding(s):`);
    for (const [key, count] of newFindings.slice(0, 30)) {
      console.error(`${key} (${count}, baseline ${baseline[key] || 0})`);
    }
    process.exitCode = 1;
  } else {
    console.log(`No new lint findings. ${total} existing findings remain in the baseline.`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
