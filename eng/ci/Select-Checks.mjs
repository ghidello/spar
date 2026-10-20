import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fullSelection, groups, selectEvent } from './selection.mjs';

let selection;
try {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  selection = selectEvent(process.env.GITHUB_EVENT_NAME, event);
} catch (error) {
  selection = fullSelection(`Classification unavailable; full coverage: ${error.message}`);
}
selection.source = process.env.GITHUB_SHA ?? null;
mkdirSync('artifacts/ci', { recursive: true });
writeFileSync('artifacts/ci/selection.json', JSON.stringify(selection, null, 2) + '\n');
if (process.env.GITHUB_OUTPUT) {
  for (const group of groups) appendFileSync(process.env.GITHUB_OUTPUT, `${group}=${selection.groups.includes(group)}\n`);
}
console.log(JSON.stringify(selection, null, 2));
