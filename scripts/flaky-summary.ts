import { existsSync, readFileSync } from 'node:fs';
import { JSON_REPORT_FILE } from '../src/config/playwright-options';

// Flaky summary (Spec 000, RF-51). CI runs it after every Playwright job (`npm run report:flaky`)
// so the number of tests that passed only on retry is visible in the job log.

interface JsonReport {
  stats?: { flaky?: number };
}

/** "Flaky tests: <n>" from the text of Playwright's JSON report (`stats.flaky`). */
export function flakySummary(jsonReportText: string): string {
  const report = JSON.parse(jsonReportText) as JsonReport;
  return `Flaky tests: ${String(report.stats?.flaky ?? 0)}`;
}

function main(): void {
  const reportPath = process.argv[2] ?? JSON_REPORT_FILE;
  if (!existsSync(reportPath)) {
    // Nothing to summarize (e.g. the job failed before Playwright ran); not a reason to fail.
    console.log(`Flaky tests: unknown (no report at ${reportPath})`);
    return;
  }
  console.log(flakySummary(readFileSync(reportPath, 'utf8')));
}

if (require.main === module) main();
