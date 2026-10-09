// Playwright version alignment (Spec 000, RF-2): the CI image `mcr.microsoft.com/playwright:v<x>-<os>`
// ships browsers for exactly one Playwright version, which must equal the locked @playwright/test.

const IMAGE_REFERENCE = /mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)(?:-[\w.]+)?/g;
const LOCKFILE_KEY = 'node_modules/@playwright/test';

interface Lockfile {
  packages?: Record<string, { version?: string } | undefined>;
}

/** Every Playwright image reference in a CI definition, with its version. */
export function playwrightImages(ciDefinition: string): { image: string; version: string }[] {
  return [...ciDefinition.matchAll(IMAGE_REFERENCE)].map((match) => ({ image: match[0], version: match[1] ?? '' }));
}

/** The @playwright/test version pinned in package-lock.json. */
export function lockedPlaywrightVersion(lockfileText: string): string | undefined {
  return (JSON.parse(lockfileText) as Lockfile).packages?.[LOCKFILE_KEY]?.version;
}

/** Undefined when aligned; otherwise a message naming both versions. */
export function checkImageVersion(image: string, installedVersion: string): string | undefined {
  const [found] = playwrightImages(image);
  if (found === undefined) return `Not a Playwright image reference: ${image}`;
  return found.version === installedVersion
    ? undefined
    : `Playwright image version ${found.version} does not match the installed @playwright/test version ${installedVersion}`;
}
