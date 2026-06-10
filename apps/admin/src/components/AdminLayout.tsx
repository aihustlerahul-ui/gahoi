'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { isSuperAdmin } from '@/lib/roles';
import type { DashboardStats } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badgeKey?: 'pendingProfiles' | 'pendingPhotos' | 'openReports';
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/profiles', label: 'Profiles', icon: '👤', badgeKey: 'pendingProfiles' },
  { href: '/photos', label: 'Photos', icon: '🖼', badgeKey: 'pendingPhotos' },
  { href: '/reports', label: 'Reports', icon: '🚨', badgeKey: 'openReports' },
  { href: '/interests', label: 'Interests', icon: '💌' },
  { href: '/success-stories', label: 'Success Stories', icon: '⭐' },
  { href: '/push', label: 'Push Notifications', icon: '📢', superAdminOnly: true },
  { href: '/broadcast', label: 'Email Broadcast', icon: '📧', superAdminOnly: true },
  { href: '/plans', label: 'Subscription Plans', icon: '💳', superAdminOnly: true },
  { href: '/users', label: 'User Management', icon: '👥', superAdminOnly: true },
  { href: '/revenue', label: 'Revenue', icon: '💰', superAdminOnly: true },
  { href: '/admins', label: 'Admin Users', icon: '🔐', superAdminOnly: true },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/profiles': 'Profile Management',
  '/photos': 'Photo Moderation',
  '/reports': 'Reports Queue',
  '/interests': 'Interest Activity',
  '/success-stories': 'Success Stories',
  '/broadcast': 'Email Broadcast',
  '/push': 'Push Notifications',
  '/plans': 'Subscription Plans',
  '/users': 'User Management',
  '/revenue': 'Revenue & Payments',
  '/admins': 'Admin Users',
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const superAdmin = isSuperAdmin(admin?.role);
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

  const visibleNav = NAV_ITEMS.filter((item) => !item.superAdminOnly || superAdmin);
  const pageTitle = PAGE_TITLES[pathname] ?? 'Admin';
  const roleLabel = superAdmin ? 'Super Admin' : 'Moderator';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <h1>Gahoi Sarthi</h1>
          <p>Admin Panel</p>
        </div>
        <nav className="admin-sidebar__nav">
          {visibleNav.map((item) => {
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
            <span className="badge badge--blue admin-topbar__role">{roleLabel}</span>
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
