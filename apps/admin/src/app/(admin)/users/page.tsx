'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Drawer } from '@/components/Drawer';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatDate, formatDateTime, statusBadgeClass } from '@/lib/format';
import { getNextCursor, type AdminUser } from '@/lib/types';

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [acting, setActing] = useState(false);

  const loadUsers = useCallback(async (query: string, nextCursor?: string | null, append = false) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (nextCursor) params.set('cursor', nextCursor);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest<AdminUser[]>(`/admin/users${qs}`);
    const next = getNextCursor(res.meta);
    setUsers((prev) => (append ? [...prev, ...res.data] : res.data));
    setCursor(next);
    setHasMore(!!next);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadUsers(search)
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load users', 'error'))
      .finally(() => setLoading(false));
  }, [search, loadUsers, showToast]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const updateTier = async (user: AdminUser, tier: 'free' | 'paid') => {
    setActing(true);
    try {
      const res = await apiRequest<AdminUser>(`/admin/users/${user.id}/tier`, {
        method: 'PATCH',
        body: JSON.stringify({ tier }),
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...res.data } : u)));
      setSelected((prev) => (prev?.id === user.id ? { ...prev, ...res.data } : prev));
      showToast(`Tier updated to ${tier}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setActing(false);
    }
  };

  const updateStatus = async (user: AdminUser, status: 'Active' | 'Suspended') => {
    setActing(true);
    try {
      const res = await apiRequest<AdminUser>(`/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...res.data } : u)));
      setSelected((prev) => (prev?.id === user.id ? { ...prev, ...res.data } : prev));
      showToast(`User ${status.toLowerCase()}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setActing(false);
    }
  };

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadUsers(search, cursor, true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load more', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>User Management</h2>
        <p>Search, suspend, or override member tiers</p>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="form-input"
          placeholder="Search by email or profile ID…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn--primary">Search</button>
        {search && (
          <button type="button" className="btn btn--ghost" onClick={() => { setSearch(''); setSearchInput(''); }}>
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="empty-state"><h3>No users found</h3></div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Profile ID</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Profile Status</th>
                  <th>Push Token</th>
                  <th>Signup</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="clickable" onClick={() => setSelected(u)}>
                    <td>{u.email}</td>
                    <td>{u.profile ? `#${u.profile.profileId}` : '—'}</td>
                    <td><span className={`badge ${statusBadgeClass(u.tier)}`}>{u.tier}</span></td>
                    <td><span className={`badge ${statusBadgeClass(u.status)}`}>{u.status}</span></td>
                    <td>{u.profile ? <span className={`badge ${statusBadgeClass(u.profile.adminStatus)}`}>{u.profile.adminStatus}</span> : '—'}</td>
                    <td>{u.hasPushToken ? '✅' : '—'}</td>
                    <td>{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="load-more">
              <button type="button" className="btn btn--secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <Drawer
          title={selected.email}
          onClose={() => setSelected(null)}
          footer={
            <div className="btn-group" style={{ flexWrap: 'wrap' }}>
              {selected.tier !== 'paid' && (
                <button type="button" className="btn btn--primary btn--sm" disabled={acting} onClick={() => updateTier(selected, 'paid')}>
                  Set Paid
                </button>
              )}
              {selected.tier !== 'free' && (
                <button type="button" className="btn btn--ghost btn--sm" disabled={acting} onClick={() => updateTier(selected, 'free')}>
                  Set Free
                </button>
              )}
              {selected.status === 'Active' ? (
                <button type="button" className="btn btn--danger btn--sm" disabled={acting} onClick={() => updateStatus(selected, 'Suspended')}>
                  Suspend
                </button>
              ) : (
                <button type="button" className="btn btn--success btn--sm" disabled={acting} onClick={() => updateStatus(selected, 'Active')}>
                  Activate
                </button>
              )}
            </div>
          }
        >
          <div className="detail-section">
            <h4>Account</h4>
            <div className="detail-row"><span className="detail-row__label">User ID</span><span className="detail-row__value" style={{ fontSize: 11, wordBreak: 'break-all' }}>{selected.id}</span></div>
            <div className="detail-row"><span className="detail-row__label">Email</span><span className="detail-row__value">{selected.email}</span></div>
            <div className="detail-row"><span className="detail-row__label">Tier</span><span className="detail-row__value"><span className={`badge ${statusBadgeClass(selected.tier)}`}>{selected.tier}</span></span></div>
            <div className="detail-row"><span className="detail-row__label">Status</span><span className="detail-row__value"><span className={`badge ${statusBadgeClass(selected.status)}`}>{selected.status}</span></span></div>
            <div className="detail-row"><span className="detail-row__label">Language</span><span className="detail-row__value">{selected.preferredLanguage}</span></div>
            <div className="detail-row"><span className="detail-row__label">Push Token</span><span className="detail-row__value">{selected.hasPushToken ? 'Yes' : 'No'}</span></div>
            <div className="detail-row"><span className="detail-row__label">Signed Up</span><span className="detail-row__value">{formatDateTime(selected.createdAt)}</span></div>
            <div className="detail-row"><span className="detail-row__label">Last Active</span><span className="detail-row__value">{formatDateTime(selected.lastActiveAt)}</span></div>
          </div>
          {selected.profile && (
            <div className="detail-section">
              <h4>Profile</h4>
              <div className="detail-row"><span className="detail-row__label">Profile ID</span><span className="detail-row__value">#{selected.profile.profileId}</span></div>
              <div className="detail-row"><span className="detail-row__label">Gender</span><span className="detail-row__value">{selected.profile.gender ?? '—'}</span></div>
              <div className="detail-row"><span className="detail-row__label">City</span><span className="detail-row__value">{selected.profile.livingCity?.name ?? '—'}</span></div>
              <div className="detail-row"><span className="detail-row__label">Admin Status</span><span className="detail-row__value"><span className={`badge ${statusBadgeClass(selected.profile.adminStatus)}`}>{selected.profile.adminStatus}</span></span></div>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}
