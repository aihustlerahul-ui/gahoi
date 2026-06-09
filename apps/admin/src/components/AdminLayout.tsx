'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/profiles', label: 'Profiles', icon: '👤', badgeKey: 'pendingProfiles' as const },
  { href: '/photos', label: 'Photos', icon: '🖼', badgeKey: 'pendingPhotos' as const },
  { href: '/reports', label: 'Reports', icon: '🚨', badgeKey: 'openReports' as const },
  { href: '/push', label: 'Push Notifications', icon: '📢' },
  { href: '/plans', label: 'Subscription Plans', icon: '💳' },
  { href: '/users', label: 'User Management', icon: '👥' },
  { href: '/revenue', label: 'Revenue', icon: '💰' },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/profiles': 'Profile Moderation',
  '/photos': 'Photo Moderation',
  '/reports': 'Reports Queue',
  '/push': 'Push Notifications',
  '/plans': 'Subscription Plans',
  '/users': 'User Management',
  '/revenue': 'Revenue & Payments',
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const [badges, setBadges] = useState<Pick<DashboardStats, 'pendingProfiles' | 'pendingPhotos' | 'openReports'>>({
    pendingProfiles: 0,
    pendingPhotos: 0,
    openReports: 0,
  });

  useEffect(() => {
    apiRequest<DashboardStats>('/admin/dashboard')
      .then((res) => {
        setBadges({
          pendingProfiles: res.data.pendingProfiles,
          pendingPhotos: res.data.pendingPhotos,
          openReports: res.data.openReports,
        });
      })
      .catch(() => {});
  }, [pathname]);

  const pageTitle = PAGE_TITLES[pathname] ?? 'Admin';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <h1>Gahoi Sarthi</h1>
          <p>Admin Panel</p>
        </div>
        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const badge = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`}
              >
                <span className="admin-nav-link__icon">{item.icon}</span>
                {item.label}
                {badge > 0 && <span className="admin-nav-link__badge">{badge}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-topbar__title">{pageTitle}</h1>
          <div className="admin-topbar__user">
            <span className="admin-topbar__email">{admin?.email}</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
              Logout
            </button>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
