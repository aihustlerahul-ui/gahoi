'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { DashboardStats, SignupDataPoint } from '@/lib/types';

function SignupChart({ data }: { data: SignupDataPoint[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="signup-chart">
      <div className="signup-chart__bars">
        {data.map((d) => (
          <div key={d.date} className="signup-chart__col">
            <div
              className="signup-chart__bar"
              style={{ height: `${(d.count / max) * 100}%` }}
              title={`${d.date}: ${d.count}`}
            />
            <span className="signup-chart__label">{d.date.slice(8)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [signups, setSignups] = useState<SignupDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest<DashboardStats>('/admin/dashboard'),
      apiRequest<SignupDataPoint[]>('/admin/analytics/signups?days=30'),
    ])
      .then(([statsRes, signupsRes]) => {
        setStats(statsRes.data);
        setSignups(signupsRes.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="empty-state">
        <h3>Could not load dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, href: '/users' },
    { label: 'Active Profiles', value: stats.activeProfiles, href: '/profiles?status=approved' },
    { label: 'Paid Users', value: stats.paidUsers, href: '/users', className: 'stat-card__value--primary' },
    { label: 'Signups Today', value: stats.signupsToday, href: '/users' },
    { label: 'Interests Today', value: stats.interestsSentToday, href: '/interests' },
    { label: 'Pending Profiles', value: stats.pendingProfiles, href: '/profiles', className: 'stat-card__value--gold' },
    { label: 'Pending Photos', value: stats.pendingPhotos, href: '/photos', className: 'stat-card__value--gold' },
    { label: 'Open Reports', value: stats.openReports, href: '/reports', className: 'stat-card__value--gold' },
    { label: 'Paid Conversion', value: `${stats.paidConversionRate}%`, href: '/revenue' },
    { label: 'Interest→Match Rate', value: `${stats.interestToMatchRate}%`, href: '/interests' },
  ];

  return (
    <>
      <div className="page-header">
        <h2>Overview</h2>
        <p>Key metrics across the Gahoi Sarthi platform</p>
      </div>

      <div className="stat-grid">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="stat-card stat-card--link">
            <div className="stat-card__label">{card.label}</div>
            <div className={`stat-card__value${card.className ? ` ${card.className}` : ''}`}>
              {typeof card.value === 'number' ? card.value.toLocaleString('en-IN') : card.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card__header">
          <h3>Daily Signups (30 days)</h3>
        </div>
        <div className="card__body">
          {signups.length > 0 ? <SignupChart data={signups} /> : <p>No signup data yet</p>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card__header">
          <h3>Email Analytics</h3>
        </div>
        <div className="card__body">
          <p style={{ color: 'var(--brand-muted)' }}>
            Email open rates: {stats.emailOpenRate ?? 'N/A — not tracked (Resend analytics not wired)'}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card__header">
          <h3>Quick Actions</h3>
        </div>
        <div className="card__body">
          <div className="quick-actions">
            <Link href="/profiles" className="btn btn--primary">
              Review Pending Profiles ({stats.pendingProfiles})
            </Link>
            <Link href="/photos" className="btn btn--secondary">
              Review Pending Photos ({stats.pendingPhotos})
            </Link>
            <Link href="/reports" className="btn btn--ghost">
              View Open Reports ({stats.openReports})
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
