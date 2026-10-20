import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { audit, fullSelection } from './selection.mjs';

// A failed selector step leaves all workflow conditions enabled. Audit that same
// full fallback, rather than interpreting missing output as permission to skip.
const steps = JSON.parse(process.env.CI_STEP_RESULTS);
const selection = steps.selection?.outcome === 'success' && existsSync('artifacts/ci/selection.json')
  ? JSON.parse(readFileSync('artifacts/ci/selection.json', 'utf8'))
  : fullSelection('Selector did not produce a report; full coverage required');
const results = audit(selection, steps);
const passed = results.every(result => result.passed);
const report = { source: process.env.GITHUB_SHA ?? null, selection, results, passed };
mkdirSync('artifacts/ci', { recursive: true });
writeFileSync('artifacts/ci/results.json', JSON.stringify(report, null, 2) + '\n');
const rows = results.map(result => `| ${result.id} | ${result.selected ? 'yes' : 'no'} | ${result.outcome} |`);
const summary = [
  '## Windows managed probe', '',
  `Selected: ${selection.groups.join(', ') || 'lightweight only'}.`, '',
  '| Check | Selected | Outcome |', '| --- | --- | --- |', ...rows, '',
  `Gate: **${passed ? 'passed' : 'failed'}**. See selection.json for paths, range and reasons.`, '',
].join('\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
console.log(summary);
if (!passed) process.exitCode = 1;
