/**
 * Split slash-separated aakna display names into searchable alias tokens.
 * Parenthetical qualifiers (e.g. location notes) are kept on the primary token only.
 */
export function parseAaknaAliases(displayName: string): string[] {
  const trimmed = displayName.trim();
  if (!trimmed) return [];

  const withoutParens = trimmed.replace(/\s*\([^)]*\)/g, '').trim();
  const segments = withoutParens.split('/').map((s) => s.trim()).filter(Boolean);

  return [...new Set([trimmed, withoutParens, ...segments])];
}

/** Case-insensitive match against display name or any parsed alias. */
export function aaknaMatchesQuery(displayName: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parseAaknaAliases(displayName).some((alias) => alias.toLowerCase().includes(q));
}
