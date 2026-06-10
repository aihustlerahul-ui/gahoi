'use client';

import { useCallback, useEffect, useState } from 'react';
import { Drawer } from '@/components/Drawer';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatDate, formatDateTime, statusBadgeClass } from '@/lib/format';
import {
  getNextCursor,
  type AdminProfileDetail,
  type ProfileListItem,
} from '@/lib/types';

type Tab = 'pending' | 'all';

export default function ProfilesPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('pending');
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminProfileDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: 'all',
    gender: '',
    tier: '',
    verified: '',
    flagged: '',
    search: '',
  });

  const buildQuery = (nextCursor?: string | null) => {
    const params = new URLSearchParams();
    if (tab === 'pending') {
      params.set('status', 'pending');
    } else {
      if (filters.status) params.set('status', filters.status);
      if (filters.gender) params.set('gender', filters.gender);
      if (filters.tier) params.set('tier', filters.tier);
      if (filters.verified) params.set('verified', filters.verified);
      if (filters.flagged) params.set('flagged', filters.flagged);
      if (filters.search) params.set('search', filters.search);
    }
    if (nextCursor) params.set('cursor', nextCursor);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const loadProfiles = useCallback(
    async (nextCursor?: string | null, append = false) => {
      const res = await apiRequest<ProfileListItem[]>(`/admin/profiles${buildQuery(nextCursor)}`);
      const next = getNextCursor(res.meta);
      setProfiles((prev) => (append ? [...prev, ...res.data] : res.data));
      setCursor(next);
      setHasMore(!!next);
    },
    [tab, filters]
  );

  useEffect(() => {
    setLoading(true);
    loadProfiles()
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load profiles', 'error'))
      .finally(() => setLoading(false));
  }, [loadProfiles, showToast]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await apiRequest<AdminProfileDetail>(`/admin/profiles/${id}`);
      setDetail(res.data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load profile', 'error');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const moderate = async (id: string, status: 'approved' | 'rejected' | 'suspended', reason?: string) => {
    setActing(id);
    try {
      await apiRequest(`/admin/profiles/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
      });
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      if (selectedId === id) closeDetail();
      showToast(`Profile ${status}`, 'success');
      setRejectTarget(null);
      setRejectReason('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setActing(null);
    }
  };

  const toggleVerified = async (id: string, isVerified: boolean) => {
    setActing(id);
    try {
      await apiRequest(`/admin/profiles/${id}/verified`, {
        method: 'PATCH',
        body: JSON.stringify({ isVerified }),
      });
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, isVerified } : p)));
      if (detail?.id === id) setDetail({ ...detail, isVerified });
      showToast(isVerified ? 'Verified badge enabled' : 'Verified badge removed', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update verification', 'error');
    } finally {
      setActing(null);
    }
  };

  const deleteProfile = async (id: string) => {
    setActing(id);
    try {
      await apiRequest(`/admin/profiles/${id}`, { method: 'DELETE' });
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      closeDetail();
      setDeleteTarget(null);
      showToast('Profile deleted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
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
        <h2>Profile Management</h2>
        <p>Review pending profiles or browse all member profiles</p>
      </div>

      <div className="tab-bar">
        <button
          type="button"
          className={`tab-bar__item${tab === 'pending' ? ' tab-bar__item--active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending Review
        </button>
        <button
          type="button"
          className={`tab-bar__item${tab === 'all' ? ' tab-bar__item--active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Profiles
        </button>
      </div>

      {tab === 'all' && (
        <div className="filter-bar">
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={filters.gender} onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}>
            <option value="">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={filters.tier} onChange={(e) => setFilters((f) => ({ ...f, tier: e.target.value }))}>
            <option value="">All tiers</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <select value={filters.verified} onChange={(e) => setFilters((f) => ({ ...f, verified: e.target.value }))}>
            <option value="">Verified: any</option>
            <option value="true">Verified</option>
            <option value="false">Not verified</option>
          </select>
          <select value={filters.flagged} onChange={(e) => setFilters((f) => ({ ...f, flagged: e.target.value }))}>
            <option value="">Flagged: any</option>
            <option value="true">Flagged (3+ reports)</option>
          </select>
          <input
            type="search"
            placeholder="Search email or profile ID"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadProfiles()}>
            Apply
          </button>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">✅</div>
          <h3>No profiles found</h3>
          <p>{tab === 'pending' ? 'No profiles pending moderation' : 'Try adjusting your filters'}</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Profile ID</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Tier</th>
                  <th>City</th>
                  <th>Reports</th>
                  <th>Verified</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="clickable" onClick={() => openDetail(p.id)}>
                    <td>#{p.profileId}</td>
                    <td>{p.email}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(p.adminStatus)}`}>{p.adminStatus}</span>
                      {p.isFlagged && <span className="badge badge--red" style={{ marginLeft: 4 }}>Flagged</span>}
                    </td>
                    <td>{p.tier}</td>
                    <td>{p.city ?? '—'}</td>
                    <td>{p.openReportCount}</td>
                    <td>{p.isVerified ? '✓' : '—'}</td>
                    <td>{formatDate(p.createdAt)}</td>
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

      {selectedId && (
        <Drawer
          title={detail ? `Profile #${detail.profileId}` : 'Profile Detail'}
          onClose={closeDetail}
          footer={
            detail && (
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn--success"
                  disabled={acting === detail.id}
                  onClick={() => moderate(detail.id, 'approved')}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  disabled={acting === detail.id}
                  onClick={() => setRejectTarget(detail.id)}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={acting === detail.id}
                  onClick={() => moderate(detail.id, 'suspended')}
                >
                  Suspend
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={acting === detail.id}
                  onClick={() => toggleVerified(detail.id, !detail.isVerified)}
                >
                  {detail.isVerified ? 'Remove Verified' : 'Mark Verified'}
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  disabled={acting === detail.id}
                  onClick={() => setDeleteTarget(detail.id)}
                >
                  Delete
                </button>
              </div>
            )
          }
        >
          {detailLoading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : detail ? (
            <>
              {detail.isFlagged && (
                <div className="alert alert--warning">⚠️ This profile has {detail.openReportCount} open reports</div>
              )}
              <div className="detail-section">
                <h4>Account</h4>
                <div className="detail-row"><span className="detail-row__label">Email</span><span className="detail-row__value">{detail.email}</span></div>
                <div className="detail-row"><span className="detail-row__label">Mobile</span><span className="detail-row__value">{detail.mobile ?? '—'}</span></div>
                <div className="detail-row"><span className="detail-row__label">Status</span><span className="detail-row__value"><span className={`badge ${statusBadgeClass(detail.adminStatus)}`}>{detail.adminStatus}</span></span></div>
                <div className="detail-row"><span className="detail-row__label">Tier</span><span className="detail-row__value">{detail.tier}</span></div>
                <div className="detail-row"><span className="detail-row__label">User Status</span><span className="detail-row__value">{detail.userStatus}</span></div>
              </div>
              <div className="detail-section">
                <h4>Profile</h4>
                <div className="detail-row"><span className="detail-row__label">Gender</span><span className="detail-row__value">{detail.gender ?? '—'}</span></div>
                <div className="detail-row"><span className="detail-row__label">Age</span><span className="detail-row__value">{detail.age ?? '—'}</span></div>
                <div className="detail-row"><span className="detail-row__label">Gotra</span><span className="detail-row__value">{detail.gotra ?? '—'}</span></div>
                <div className="detail-row"><span className="detail-row__label">City</span><span className="detail-row__value">{detail.city ?? '—'}</span></div>
                <div className="detail-row"><span className="detail-row__label">Completeness</span><span className="detail-row__value">{detail.profileCompletenessPct ?? 0}%</span></div>
              </div>
              {detail.education && (
                <div className="detail-section">
                  <h4>Education</h4>
                  <div className="detail-row"><span className="detail-row__label">Degree</span><span className="detail-row__value">{detail.education.highestDegree ?? '—'}</span></div>
                  <div className="detail-row"><span className="detail-row__label">Field</span><span className="detail-row__value">{detail.education.fieldOfStudy ?? '—'}</span></div>
                </div>
              )}
              {detail.occupation && (
                <div className="detail-section">
                  <h4>Occupation</h4>
                  <div className="detail-row"><span className="detail-row__label">Type</span><span className="detail-row__value">{detail.occupation.occupationType ?? '—'}</span></div>
                  <div className="detail-row"><span className="detail-row__label">Job</span><span className="detail-row__value">{detail.occupation.jobTitle ?? '—'}</span></div>
                </div>
              )}
              {detail.family && (
                <div className="detail-section">
                  <h4>Family</h4>
                  <div className="detail-row"><span className="detail-row__label">Father</span><span className="detail-row__value">{detail.family.fatherName ?? '—'}</span></div>
                  <div className="detail-row"><span className="detail-row__label">Address</span><span className="detail-row__value">{detail.family.homeAddress ?? '—'}</span></div>
                </div>
              )}
              {detail.interestStats && (
                <div className="detail-section">
                  <h4>Interests</h4>
                  <div className="detail-row"><span className="detail-row__label">Sent</span><span className="detail-row__value">{detail.interestStats.sent}</span></div>
                  <div className="detail-row"><span className="detail-row__label">Received</span><span className="detail-row__value">{detail.interestStats.received}</span></div>
                  <div className="detail-row"><span className="detail-row__label">Accepted</span><span className="detail-row__value">{detail.interestStats.accepted}</span></div>
                </div>
              )}
              {detail.gallery && detail.gallery.length > 0 && (
                <div className="detail-section">
                  <h4>Gallery</h4>
                  <div className="gallery-grid">
                    {detail.gallery.map((g) => (
                      <div key={g.id} className="gallery-grid__item">
                        {g.signedUrl ? (
                          <img src={g.signedUrl} alt="" />
                        ) : (
                          <div className="gallery-grid__placeholder">No preview</div>
                        )}
                        <span className={`badge ${statusBadgeClass(g.adminStatus)}`}>{g.adminStatus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detail.aboutMe && (
                <div className="detail-section">
                  <h4>About Me</h4>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--brand-text-secondary)' }}>{detail.aboutMe}</p>
                </div>
              )}
            </>
          ) : null}
        </Drawer>
      )}

      {rejectTarget && (
        <Modal title="Reject Profile" onClose={() => { setRejectTarget(null); setRejectReason(''); }}>
          <p style={{ marginBottom: 12 }}>Provide a reason — the member will receive this in an email.</p>
          <textarea
            className="form-input"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection…"
          />
          <div className="btn-group" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn--danger"
              disabled={!rejectReason.trim() || acting === rejectTarget}
              onClick={() => moderate(rejectTarget, 'rejected', rejectReason.trim())}
            >
              Reject Profile
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete Profile" onClose={() => setDeleteTarget(null)}>
          <p>This permanently deletes the user and all related data. This cannot be undone.</p>
          <div className="btn-group" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn--danger"
              disabled={acting === deleteTarget}
              onClick={() => deleteProfile(deleteTarget)}
            >
              Confirm Delete
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
