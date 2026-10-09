import http from 'node:http';
import https from 'node:https';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Spec 000 — Framework foundation. RF-6 / constitution #5: unit tests never reach the network.
// The guard installed by tests/unit/setup/block-network.ts turns any real request into an error,
// while mocked dependencies keep working.
const LOCAL_URL = 'http://localhost:9/TEST_path';
const REMOTE_URL = 'https://example.com/TEST_path';
const MOCKED_TOKEN = 'TEST_token';
const GUARD_MESSAGE = 'Network access is disabled in unit tests:';

// Minimal unit under test: reads a token through whatever fetch implementation is injected globally.
async function readToken(url: string): Promise<string> {
  const response = await fetch(url);
  const body = (await response.json()) as { token: string };
  return body.token;
}

afterEach(() => {
  // Restore the guard after a test replaced fetch with a mock.
  vi.unstubAllGlobals();
});

describe('Network guard — positive', () => {
  it('TC-000-10 unit test with a mocked HTTP dependency makes no network request', async () => {
    // Arrange: replace the HTTP dependency with a mock returning a TEST_ token.
    const mockedFetch = vi.fn().mockResolvedValue(Response.json({ token: MOCKED_TOKEN }));
    vi.stubGlobal('fetch', mockedFetch);

    // Act
    const token = await readToken(REMOTE_URL);

    // Assert: the mock answered, so the guard never had to block a real request.
    expect(token).toBe(MOCKED_TOKEN);
    expect(mockedFetch).toHaveBeenCalledWith(REMOTE_URL);
  });
});

describe('Network guard — negative', () => {
  it('TC-000-11 unit test sending a real request fails, localhost included', async () => {
    // Arrange: one local and one remote target; localhost is a boundary — it is still network.
    // The options object is the form many HTTP libraries use instead of a URL string.
    const expectedLocal = `${GUARD_MESSAGE} ${LOCAL_URL}`;
    const expectedRemote = `${GUARD_MESSAGE} ${REMOTE_URL}`;
    const localOptions = { protocol: 'http:', hostname: 'localhost', port: 9, path: '/TEST_path' };

    // Act + Assert: every client API is blocked with a message naming the URL.
    expect(() => http.get(LOCAL_URL)).toThrow(expectedLocal);
    expect(() => http.request(LOCAL_URL)).toThrow(expectedLocal);
    expect(() => http.request(localOptions)).toThrow(expectedLocal);
    expect(() => https.get(REMOTE_URL)).toThrow(expectedRemote);
    expect(() => https.request(new URL(REMOTE_URL))).toThrow(expectedRemote);
    await expect(fetch(LOCAL_URL)).rejects.toThrow(expectedLocal);
    await expect(fetch(REMOTE_URL)).rejects.toThrow(expectedRemote);
  });
});
