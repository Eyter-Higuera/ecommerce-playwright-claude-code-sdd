// Reads what spec:check needs from a spec.md: its status and its RF IDs (Spec 000, RF-31 to RF-43).

export const SPEC_STATUSES = ['draft', 'approved', 'test-cases-approved', 'implemented', 'validated'] as const;
export type SpecStatus = (typeof SPEC_STATUSES)[number];

export interface SpecInfo {
  /** Three-digit spec number, e.g. "000". */
  id: string;
  /** Folder relative to the repository root, e.g. "specs/000-framework-foundation". */
  dir: string;
  status: string;
  rfs: string[];
}

const STATUS_LINE = /^Status:\s*(\S+)/m;
const RF_LINE = /^- (RF-\d+):/gm;
export const SPEC_FOLDER = /^(\d{3})-[a-z0-9-]+$/;

export function parseSpec(markdown: string, id: string, dir: string): SpecInfo {
  const status = STATUS_LINE.exec(markdown)?.[1] ?? 'unknown';
  const rfs = [...markdown.matchAll(RF_LINE)].map((match) => match[1] ?? '');
  return { id, dir, status, rfs };
}

/** Position of a status in the SDD flow; unknown statuses rank before `draft`. */
export function statusRank(status: string): number {
  return SPEC_STATUSES.indexOf(status as SpecStatus);
}
