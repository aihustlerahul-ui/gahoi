'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin } from '@/lib/roles';

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && admin && !isSuperAdmin(admin.role)) {
      router.replace('/');
    }
  }, [isLoading, admin, router]);

  if (isLoading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!admin || !isSuperAdmin(admin.role)) {
    return (
      <div className="empty-state">
        <h3>Access restricted</h3>
        <p>This section requires super admin privileges.</p>
      </div>
    );
  }

  return <>{children}</>;
}
