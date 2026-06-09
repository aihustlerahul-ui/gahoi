'use client';

import { useCallback, useEffect, useState } from 'react';
import { Drawer } from '@/components/Drawer';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { calcAge, formatDate, formatDateTime, statusBadgeClass } from '@/lib/format';
import { getNextCursor, type PendingProfile } from '@/lib/types';

export default function ProfilesPage() {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<PendingProfile | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const loadProfiles = useCallback(async (nextCursor?: string | null, append = false) => {
    const params = nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : '';
    const res = await apiRequest<PendingProfile[]>(`/admin/profiles${params}`);
    const next = getNextCursor(res.meta);
    setProfiles((prev) => (append ? [...prev, ...res.data] : res.data));
    setCursor(next);
    setHasMore(!!next);
  }, []);

  useEffect(() => {
    loadProfiles()
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load profiles', 'error'))
      .finally(() => setLoading(false));
  }, [loadProfiles, showToast]);

  const moderate = async (id: string, status: 'approved' | 'rejected' | 'suspended') => {
    setActing(id);
    try {
      await apiRequest(`/admin/profiles/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      if (selected?.id === id) setSelected(null);
      showToast(`Profile ${status}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setActing(null);
    }
  };

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadProfiles(cursor, true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load more', 'error');
    } finally {
      setLoadingMore(false);
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
    <>
      <div className="page-header">
        <h2>Profile Moderation</h2>
        <p>Review and approve pending member profiles</p>
      </div>

      {profiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">✅</div>
          <h3>All caught up</h3>
          <p>No profiles pending moderation</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Profile ID</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>City</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="clickable" onClick={() => setSelected(p)}>
                    <td>#{p.profileId}</td>
                    <td>{p.user.email}</td>
                    <td>{p.gender ?? '—'}</td>
                    <td>{calcAge(p.dateOfBirth)}</td>
                    <td>{p.livingCity?.name ?? '—'}</td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn--success btn--sm"
                          disabled={acting === p.id}
                          onClick={() => moderate(p.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          disabled={acting === p.id}
                          onClick={() => moderate(p.id, 'rejected')}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          disabled={acting === p.id}
                          onClick={() => moderate(p.id, 'suspended')}
                        >
                          Suspend
                        </button>
                      </div>
                    </td>
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
          title={`Profile #${selected.profileId}`}
          onClose={() => setSelected(null)}
          footer={
            <div className="btn-group">
              <button type="button" className="btn btn--success" disabled={acting === selected.id} onClick={() => moderate(selected.id, 'approved')}>
                Approve
              </button>
              <button type="button" className="btn btn--danger" disabled={acting === selected.id} onClick={() => moderate(selected.id, 'rejected')}>
                Reject
              </button>
              <button type="button" className="btn btn--ghost" disabled={acting === selected.id} onClick={() => moderate(selected.id, 'suspended')}>
                Suspend
              </button>
            </div>
          }
        >
          <div className="detail-section">
            <h4>Basic Info</h4>
            <div className="detail-row"><span className="detail-row__label">Email</span><span className="detail-row__value">{selected.user.email}</span></div>
            <div className="detail-row"><span className="detail-row__label">Status</span><span className="detail-row__value"><span className={`badge ${statusBadgeClass(selected.adminStatus)}`}>{selected.adminStatus}</span></span></div>
            <div className="detail-row"><span className="detail-row__label">Gender</span><span className="detail-row__value">{selected.gender ?? '—'}</span></div>
            <div className="detail-row"><span className="detail-row__label">Age</span><span className="detail-row__value">{calcAge(selected.dateOfBirth)}</span></div>
            <div className="detail-row"><span className="detail-row__label">Gotra</span><span className="detail-row__value">{selected.gotra ?? '—'}</span></div>
            <div className="detail-row"><span className="detail-row__label">Marital Status</span><span className="detail-row__value">{selected.maritalStatus ?? '—'}</span></div>
            <div className="detail-row"><span className="detail-row__label">Height</span><span className="detail-row__value">{selected.height_cm ? `${selected.height_cm} cm` : '—'}</span></div>
            <div className="detail-row"><span className="detail-row__label">Complexion</span><span className="detail-row__value">{selected.complexion ?? '—'}</span></div>
            <div className="detail-row"><span className="detail-row__label">City</span><span className="detail-row__value">{selected.livingCity?.name ?? '—'}</span></div>
            <div className="detail-row"><span className="detail-row__label">Native State</span><span className="detail-row__value">{selected.nativeState ?? '—'}</span></div>
            <div className="detail-row"><span className="detail-row__label">Mobile</span><span className="detail-row__value">{selected.mobile ?? '—'}</span></div>
            <div className="detail-row"><span className="detail-row__label">Submitted</span><span className="detail-row__value">{formatDateTime(selected.createdAt)}</span></div>
          </div>
          {selected.aboutMe && (
            <div className="detail-section">
              <h4>About Me</h4>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--brand-text-secondary)' }}>{selected.aboutMe}</p>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}
