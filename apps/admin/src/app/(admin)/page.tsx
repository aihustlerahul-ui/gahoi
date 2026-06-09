'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<DashboardStats>('/admin/dashboard')
      .then((res) => setStats(res.data))
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
    return <div className="empty-state"><h3>Could not load dashboard</h3><p>{error}</p></div>;
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, href: '/users' },
    { label: 'Paid Users', value: stats.paidUsers, href: '/users', className: 'stat-card__value--primary' },
    { label: 'Free Users', value: stats.freeUsers, href: '/users' },
    { label: 'Pending Profiles', value: stats.pendingProfiles, href: '/profiles', className: 'stat-card__value--gold' },
    { label: 'Pending Photos', value: stats.pendingPhotos, href: '/photos', className: 'stat-card__value--gold' },
    { label: 'Open Reports', value: stats.openReports, href: '/reports', className: 'stat-card__value--gold' },
    { label: 'Signups (7 days)', value: stats.recentSignups, href: '/users' },
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
              {card.value.toLocaleString('en-IN')}
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
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
            <Link href="/push" className="btn btn--secondary">
              Send Push Broadcast
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
