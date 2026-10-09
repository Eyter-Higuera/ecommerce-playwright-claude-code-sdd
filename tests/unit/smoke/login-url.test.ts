import { describe, expect, it } from 'vitest';
import { buildLoginUrl } from '../../../src/config/urls';

// Spec 000 — Framework foundation. RF-52: the UI sanity test opens BASE_URL + `/#/auth/login`
// with a single `/`, whether or not BASE_URL ends with one. A double slash would load a different
// route on some servers, and a missing one would glue the hash to the last path segment.
const BASE_WITHOUT_SLASH = 'https://TEST_host/client';
const BASE_WITH_SLASH = 'https://TEST_host/client/';
const EXPECTED_LOGIN_URL = 'https://TEST_host/client/#/auth/login';

describe('Login URL — boundary', () => {
  it('TC-000-77 login URL has a single slash with or without trailing slash', () => {
    // Arrange: both accepted forms of BASE_URL.
    const bases = [BASE_WITHOUT_SLASH, BASE_WITH_SLASH];

    // Act
    const urls = bases.map((base) => buildLoginUrl(base));

    // Assert: both forms give the same canonical URL.
    expect(urls).toEqual([EXPECTED_LOGIN_URL, EXPECTED_LOGIN_URL]);
  });
});
