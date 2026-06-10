'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { SuperAdminGuard } from '@/components/SuperAdminGuard';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { AdminAccount } from '@/lib/types';

export default function AdminsPage() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'moderator' | 'super_admin'>('moderator');
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<AdminAccount[]>('/admin/admins')
      .then((res) => setAdmins(res.data))
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load admins', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const invite = async () => {
    setActing('invite');
    try {
      const res = await apiRequest<AdminAccount>('/admin/admins', {
        method: 'POST',
        body: JSON.stringify({ email, name: name || undefined, role }),
      });
      setAdmins((prev) => [res.data, ...prev]);
      setShowInvite(false);
      setEmail('');
      setName('');
      setRole('moderator');
      showToast('Admin invited', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invite failed', 'error');
    } finally {
      setActing(null);
    }
  };

  const toggleActive = async (admin: AdminAccount) => {
    setActing(admin.id);
    try {
      const res = await apiRequest<AdminAccount>(`/admin/admins/${admin.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !admin.isActive }),
      });
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? res.data : a)));
      showToast(res.data.isActive ? 'Admin activated' : 'Admin deactivated', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <SuperAdminGuard>
      <div className="page-header">
        <h2>Admin Users</h2>
        <p>Manage admin panel access and roles</p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button type="button" className="btn btn--primary" onClick={() => setShowInvite(true)}>
          Invite Admin
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.email}</td>
                <td>{a.name ?? '—'}</td>
                <td><span className="badge badge--blue">{a.role}</span></td>
                <td>{a.isActive ? 'Active' : 'Inactive'}</td>
                <td>{a.lastLoginAt ? formatDateTime(a.lastLoginAt) : '—'}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={acting === a.id}
                    onClick={() => toggleActive(a)}
                  >
                    {a.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <Modal title="Invite Admin" onClose={() => setShowInvite(false)}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Name (optional)</label>
            <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-input" value={role} onChange={(e) => setRole(e.target.value as 'moderator' | 'super_admin')}>
              <option value="moderator">Moderator</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="btn-group" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn--primary" disabled={!email || acting === 'invite'} onClick={invite}>
              Invite
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setShowInvite(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </SuperAdminGuard>
  );
}
