/**
 * Masking utilities — ALWAYS use these, never roll your own.
 * Three-tier visibility: free → null | paid+no match → masked | paid+matched → full
 */

export function maskPhone(phone: string): string {
  if (phone.length <= 2) return phone;
  return `${phone[0]}${'*'.repeat(phone.length - 2)}${phone[phone.length - 1]}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return email;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export function maskAddress(address: string): string {
  const parts = address.split(',');
  if (parts.length <= 1) return address;
  const city = parts[parts.length - 1].trim();
  return `***, ${city}`;
}

export function maskName(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => {
      if (part.length <= 1) return part;
      return `${part[0]}${'*'.repeat(part.length - 1)}`;
    })
    .join(' ');
}
