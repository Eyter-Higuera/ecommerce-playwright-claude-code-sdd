import { randomBytes } from 'node:crypto';

// TEST_ data factory (Spec 000, RF-44 / RF-45). Every value created on the target site carries
// the TEST_ prefix, so it is identifiable and safe to clean up, plus the worker ID and a timestamp,
// so parallel workers and consecutive runs never collide.

export const TEST_DATA_PREFIX = 'TEST_';

/** Bytes of randomness per process, so two runs started in the same millisecond still differ. */
const RUN_SUFFIX_BYTES = 2;
const RUN_SUFFIX = randomBytes(RUN_SUFFIX_BYTES).toString('hex');

// Per-process sequence: keeps values unique when the clock does not move between two calls.
let sequence = 0;

/**
 * Builds `TEST_<base>_w<workerId>_<timestamp>_<sequence><runSuffix>`.
 * @param workerId Playwright `testInfo.workerIndex` (or any per-worker number).
 * @param clock Injected for tests; defaults to the real clock.
 */
export function uniqueValue(base: string, workerId: number, clock: () => number = Date.now): string {
  sequence += 1;
  return `${TEST_DATA_PREFIX}${base}_w${String(workerId)}_${String(clock())}_${String(sequence)}${RUN_SUFFIX}`;
}
