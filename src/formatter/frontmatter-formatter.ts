/**
 * Canonical key order for frontmatter.
 * Keys not in this list are sorted alphabetically after the canonical ones.
 */
const KEY_ORDER = [
  'type',
  'id',
  'status',
  'version',
  'owner',
  'priority',
  'tags',
  'created',
  'updated',
];

/**
 * Reorder frontmatter keys according to canonical order.
 * Preserves original value formatting (line-level, no YAML re-serialization).
 */
export function formatFrontmatter(fmLines: string[]): string[] {
  // Parse key-value pairs preserving original text
  const entries: { key: string; line: string }[] = [];
  for (const line of fmLines) {
    const match = line.match(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/);
    if (match) {
      entries.push({ key: match[2], line });
    } else {
      // Non-key lines (e.g., continuation of array) — attach to previous entry
      if (entries.length > 0) {
        entries[entries.length - 1].line += '\n' + line;
      }
    }
  }

  // Sort by canonical order, then alphabetical for unknown keys
  entries.sort((a, b) => {
    const aIdx = KEY_ORDER.indexOf(a.key);
    const bIdx = KEY_ORDER.indexOf(b.key);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.key.localeCompare(b.key);
  });

  // Flatten back to lines, trimming trailing whitespace
  const result: string[] = [];
  for (const entry of entries) {
    const subLines = entry.line.split('\n');
    result.push(...subLines.map(l => l.trimEnd()));
  }

  return result;
}
