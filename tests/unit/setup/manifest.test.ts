import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Spec 000 — Framework foundation. The repository manifests must make `npm ci` refuse to install
// on a Node major lower than 20 (RF-3). Reading the manifests keeps this test offline and fast;
// the real installation on Node 18 is checked manually (TC-000-02).
const REPO_ROOT = resolve(__dirname, '../../..');
const REQUIRED_NODE_RANGE = '>=20';

interface PackageManifest {
  engines?: { node?: string };
}

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('Package manifest — positive', () => {
  it('TC-000-03 package manifest enforces Node 20 or later', () => {
    // Arrange: load package.json and the npm settings committed with the repository.
    const manifest = JSON.parse(readRepoFile('package.json')) as PackageManifest;
    const npmrcLines = readRepoFile('.npmrc')
      .split(/\r?\n/)
      .map((line) => line.trim());

    // Act: extract the declared Node range and whether npm treats engines as strict.
    const nodeRange = manifest.engines?.node;
    const engineStrict = npmrcLines.includes('engine-strict=true');

    // Assert: Node 20 is the lower bound and npm fails instead of only warning on older Node.
    expect(nodeRange).toBe(REQUIRED_NODE_RANGE);
    expect(engineStrict).toBe(true);
  });
});
