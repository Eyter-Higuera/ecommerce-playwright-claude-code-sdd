import { describe, expect, it } from 'vitest';
import { TEST_DATA_PREFIX, uniqueValue } from '../../../src/data/test-data-factory';

// Spec 000 — Framework foundation. RF-44 / RF-45: every generated value starts with TEST_ (so test
// data is identifiable and safe to clean up) and carries the worker ID and a timestamp, so
// parallel workers never collide.
const BASE_NAME = 'user';
const WORKER_IDS = [0, 1, 2, 3];
const VALUES_PER_WORKER = 2_500;
const FROZEN_TIME_MS = 1_700_000_000_000;

describe('Test data factory — positive', () => {
  it('TC-000-66 generated values start with TEST_', () => {
    // Arrange
    const workerId = 0;

    // Act
    const value = uniqueValue(BASE_NAME, workerId);

    // Assert: the prefix comes first, followed by the requested base name.
    expect(value.startsWith(`${TEST_DATA_PREFIX}${BASE_NAME}_`)).toBe(true);
  });
});

describe('Test data factory — boundary', () => {
  it('TC-000-67 10,000 values across 4 workers are unique and all prefixed', () => {
    // Arrange: 2,500 values for each worker ID, as four parallel workers would generate.
    const total = WORKER_IDS.length * VALUES_PER_WORKER;

    // Act
    const values = WORKER_IDS.flatMap((workerId) => Array.from({ length: VALUES_PER_WORKER }, () => uniqueValue(BASE_NAME, workerId)));

    // Assert: no collision, and every value is identifiable as test data.
    expect(new Set(values).size).toBe(total);
    expect(values.filter((value) => !value.startsWith(TEST_DATA_PREFIX))).toEqual([]);
  });

  it('TC-000-68 values generated in the same millisecond still differ', () => {
    // Arrange: a frozen clock, so both values share the same timestamp.
    const frozenClock = () => FROZEN_TIME_MS;

    // Act
    const first = uniqueValue(BASE_NAME, 0, frozenClock);
    const second = uniqueValue(BASE_NAME, 0, frozenClock);

    // Assert: still different, and both carry the worker ID and the timestamp.
    expect(first).not.toBe(second);
    for (const value of [first, second]) {
      expect(value).toContain('_w0_');
      expect(value).toContain(String(FROZEN_TIME_MS));
    }
  });
});
