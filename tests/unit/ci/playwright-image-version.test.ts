import { describe, expect, it } from 'vitest';
import { checkImageVersion } from '../../../scripts/lib/playwright-version';

// Spec 000 — Framework foundation. RF-2: CI runs in the Playwright Docker image whose version must
// equal the installed @playwright/test version; otherwise the browsers in the image do not match
// the library and runs fail in confusing ways. The check reports both versions.
const OLD_IMAGE = 'mcr.microsoft.com/playwright:v1.40.0-jammy';
const INSTALLED_VERSION = '1.48.0';

describe('Playwright image version — negative', () => {
  it('TC-000-05 CI image version check reports a mismatch naming both versions', () => {
    // Arrange: an image tag and an installed version that differ (synthetic values).
    const image = OLD_IMAGE;

    // Act
    const problem = checkImageVersion(image, INSTALLED_VERSION);

    // Assert: a mismatch is reported, naming both versions so the fix is obvious.
    expect(problem).toBeDefined();
    expect(problem).toContain('1.40.0');
    expect(problem).toContain('1.48.0');
  });
});
