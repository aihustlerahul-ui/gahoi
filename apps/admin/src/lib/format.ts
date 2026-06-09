export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '—';
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return String(age);
}

export function photoUrl(r2Key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (base) {
    return `${base.replace(/\/$/, '')}/${r2Key}`;
  }
  return '';
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    approved: 'badge--green',
    active: 'badge--green',
    Active: 'badge--green',
    paid: 'badge--blue',
    pending: 'badge--amber',
    open: 'badge--amber',
    rejected: 'badge--red',
    suspended: 'badge--red',
    Suspended: 'badge--red',
    resolved: 'badge--gray',
    free: 'badge--gray',
    created: 'badge--gray',
  };
  return map[status] ?? 'badge--gray';
}
