/** Height in feet/inches — primary UI unit. height_cm kept in DB for legacy index/backfill. */

export const HEIGHT_FT_OPTIONS = [4, 5, 6, 7] as const;
export const HEIGHT_IN_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export type HeightFt = (typeof HEIGHT_FT_OPTIONS)[number];
export type HeightIn = (typeof HEIGHT_IN_OPTIONS)[number];

export function heightToTotalInches(ft: number, inches: number): number {
  return ft * 12 + inches;
}

/** Convert ft/in to cm (rounded). Standard: 1 inch = 2.54 cm. */
export function heightFtInToCm(ft: number, inches: number): number {
  return Math.round(heightToTotalInches(ft, inches) * 2.54);
}

/** Convert cm to nearest ft/in. Used when reading legacy height_cm-only rows. */
export function cmToHeightFtIn(cm: number): { ft: number; in: number } {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { ft, in: inches };
}

export function formatHeightFtIn(ft: number | null | undefined, inches: number | null | undefined): string {
  if (ft == null) return '';
  return `${ft}'${inches ?? 0}"`;
}

/** Resolve stored height: prefer explicit ft/in, fall back to cm conversion. */
export function resolveHeightFtIn(
  ft: number | null | undefined,
  inches: number | null | undefined,
  cm: number | null | undefined,
): { ft: number | null; in: number | null } {
  if (ft != null) {
    return { ft, in: inches ?? 0 };
  }
  if (cm != null) {
    const converted = cmToHeightFtIn(cm);
    return converted;
  }
  return { ft: null, in: null };
}
