import type { RawLine, FrontmatterBounds } from '../types/ast.js';

export interface ScanResult {
  lines: RawLine[];
  frontmatter: FrontmatterBounds | null;
}

export function scan(source: string): ScanResult {
  const rawLines = source.split(/\r?\n/);
  const lines: RawLine[] = rawLines.map((text, i) => ({
    lineNumber: i + 1,
    text,
  }));

  const frontmatter = extractFrontmatter(lines);
  return { lines, frontmatter };
}

function extractFrontmatter(lines: RawLine[]): FrontmatterBounds | null {
  if (lines.length === 0) return null;

  // First line must be ---
  const first = lines[0];
  if (first.text.trim() !== '---') return null;

  // Find closing ---
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].text.trim() === '---') {
      const contentLines = lines.slice(1, i).map(l => l.text);
      return {
        startLine: first.lineNumber,
        endLine: lines[i].lineNumber,
        content: contentLines.join('\n'),
      };
    }
  }

  return null;
}
