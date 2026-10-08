// Reads the test cases of a test-cases.md: ID, referenced RFs and the Automate flag
// (Spec 000, RF-32, RF-33, RF-35). Each TC is a `### TC-NNN-XX — title` section with a field table.

export interface TestCaseInfo {
  id: string;
  requirements: string[];
  automate: boolean;
}

const SECTION_HEADING = /^### (TC-\d{3}-\d{2})\b/gm;
const NEXT_HEADING = /^#{2,3} /m;
const REQUIREMENT_ROW = /^\|\s*Requirement\s*\|([^\n]*)\|/m;
const AUTOMATE_YES_ROW = /^\|\s*Automate\s*\|\s*Y\b/m;
const RF_ID = /RF-\d+/g;

/** Every TC section in file order; a TC ID defined twice appears twice (RF-35 checks that). */
export function parseTestCases(markdown: string): TestCaseInfo[] {
  return [...markdown.matchAll(SECTION_HEADING)].map((match) => {
    const start = (match.index ?? 0) + match[0].length;
    const rest = markdown.slice(start);
    const end = NEXT_HEADING.exec(rest)?.index ?? rest.length;
    const section = rest.slice(0, end);
    return {
      id: match[1] ?? '',
      requirements: REQUIREMENT_ROW.exec(section)?.[1]?.match(RF_ID) ?? [],
      automate: AUTOMATE_YES_ROW.test(section),
    };
  });
}
