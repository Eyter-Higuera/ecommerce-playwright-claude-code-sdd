// Fixture for TC-000-07: intentionally invalid code that strict mode must reject.
// Excluded from the repository typecheck; only tests/unit/setup/typecheck.test.ts compiles it.

// Line 5: a string assigned to a number (TS2322).
export const count: number = 'TEST_text';

// Line 8: parameter without a type, an implicit `any` (TS7006).
export function echo(value) {
  return value;
}
