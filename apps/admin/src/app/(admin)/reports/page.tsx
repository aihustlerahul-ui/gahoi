'use client';

import { useCallback, useEffect, useState } from 'react';
import { Drawer } from '@/components/Drawer';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import { getNextCursor, type Report } from '@/lib/types';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const loadReports = useCallback(async (nextCursor?: string | null, append = false) => {
    const params = nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : '';
    const res = await apiRequest<Report[]>(`/admin/reports${params}`);
    const next = getNextCursor(res.meta);
    setReports((prev) => (append ? [...prev, ...res.data] : res.data));
    setCursor(next);
    setHasMore(!!next);
  }, []);

  useEffect(() => {
    loadReports()
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load reports', 'error'))
      .finally(() => setLoading(false));
  }, [loadReports, showToast]);

  const resolve = async (id: string, action: 'resolve_no_action' | 'resolve_suspend_user') => {
    setActing(id);
    try {
      await apiRequest(`/admin/reports/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selected?.id === id) setSelected(null);
      showToast(action === 'resolve_suspend_user' ? 'Report resolved — user suspended' : 'Report resolved', 'success');
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
      await loadReports(cursor, true);
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
        <h2>Reports Queue</h2>
        <p>Review and resolve member reports</p>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🚨</div>
          <h3>No open reports</h3>
          <p>All reports have been resolved</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reporter ID</th>
                  <th>Reported Profile</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="clickable" onClick={() => setSelected(r)}>
                    <td><code style={{ fontSize: 12 }}>{r.reporterId.slice(0, 8)}…</code></td>
                    <td>#{r.reported.profileId} — {r.reported.user.email}</td>
                    <td><span className="badge badge--amber">{r.reasonCode}</span></td>
                    <td>{formatDate(r.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn--success btn--sm"
                          disabled={acting === r.id}
                          onClick={() => resolve(r.id, 'resolve_no_action')}
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          disabled={acting === r.id}
                          onClick={() => resolve(r.id, 'resolve_suspend_user')}
                        >
                          Suspend User
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
          title={`Report — ${selected.reasonCode}`}
          onClose={() => setSelected(null)}
          footer={
            <div className="btn-group">
              <button type="button" className="btn btn--success" disabled={acting === selected.id} onClick={() => resolve(selected.id, 'resolve_no_action')}>
                Resolve (No Action)
              </button>
              <button type="button" className="btn btn--danger" disabled={acting === selected.id} onClick={() => resolve(selected.id, 'resolve_suspend_user')}>
                Resolve + Suspend
              </button>
            </div>
          }
        >
          <div className="detail-section">
            <h4>Report Details</h4>
            <div className="detail-row"><span className="detail-row__label">Reason Code</span><span className="detail-row__value">{selected.reasonCode}</span></div>
            <div className="detail-row"><span className="detail-row__label">Reporter ID</span><span className="detail-row__value" style={{ fontSize: 11, wordBreak: 'break-all' }}>{selected.reporterId}</span></div>
            <div className="detail-row"><span className="detail-row__label">Reported Profile</span><span className="detail-row__value">#{selected.reported.profileId}</span></div>
            <div className="detail-row"><span className="detail-row__label">Reported Email</span><span className="detail-row__value">{selected.reported.user.email}</span></div>
            <div className="detail-row"><span className="detail-row__label">Submitted</span><span className="detail-row__value">{formatDateTime(selected.createdAt)}</span></div>
          </div>
          {selected.detail && (
            <div className="detail-section">
              <h4>Additional Detail</h4>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--brand-text-secondary)' }}>{selected.detail}</p>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}
