/** Public shareable profile ID — separate from internal UUID (`Profile.id`) */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Strip optional GS- / GS prefix and whitespace */
export function parsePublicProfileId(input: string): number | null {
  const trimmed = input.trim();
  const normalized = trimmed.replace(/^gs[-\s]*/i, '');
  if (!/^\d{1,9}$/.test(normalized)) return null;
  const value = Number(normalized);
  return value > 0 ? value : null;
}

export function isProfileUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/** Display label shown in app UI, e.g. GS-23432 */
export function formatProfileIdLabel(profileId: number): string {
  return `GS-${profileId}`;
}

/** Raw numeric ID for sharing in messages, e.g. 23432 */
export function formatPublicProfileId(profileId: number): string {
  return String(profileId);
}

/** Share message body */
export function buildProfileShareText(profileId: number): string {
  return `Find my Gahoi Sarthi profile: ${formatProfileIdLabel(profileId)} (ID: ${formatPublicProfileId(profileId)})`;
}

/** Minimum value for newly issued public profile IDs */
export const PUBLIC_PROFILE_ID_MIN = 100_000;
