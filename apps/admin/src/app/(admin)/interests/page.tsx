'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { getNextCursor, type InterestAbuseAlert, type InterestActivity } from '@/lib/types';

export default function InterestsPage() {
  const { showToast } = useToast();
  const [interests, setInterests] = useState<InterestActivity[]>([]);
  const [abuseAlerts, setAbuseAlerts] = useState<InterestAbuseAlert[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const loadInterests = useCallback(async (nextCursor?: string | null, append = false) => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (nextCursor) params.set('cursor', nextCursor);
    const qs = params.toString();
    const res = await apiRequest<InterestActivity[]>(`/admin/interests${qs ? `?${qs}` : ''}`);
    const next = getNextCursor(res.meta);
    setInterests((prev) => (append ? [...prev, ...res.data] : res.data));
    setCursor(next);
    setHasMore(!!next);
  }, [statusFilter]);

  useEffect(() => {
    Promise.all([
      loadInterests(),
      apiRequest<InterestAbuseAlert[]>('/admin/interests/abuse'),
    ])
      .then(([, abuseRes]) => setAbuseAlerts(abuseRes.data))
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load interests', 'error'))
      .finally(() => setLoading(false));
  }, [loadInterests, showToast]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadInterests(cursor, true);
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
        <h2>Interest Activity</h2>
        <p>Monitor interest sends and abuse signals</p>
      </div>

      {abuseAlerts.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__header">
            <h3>⚠️ Abuse Alerts — High Volume Senders Today</h3>
          </div>
          <div className="card__body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Profile ID</th>
                    <th>Email</th>
                    <th>Tier</th>
                    <th>Sent Today</th>
                    <th>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {abuseAlerts.map((a) => (
                    <tr key={a.id}>
                      <td>#{a.profileId}</td>
                      <td>{a.email}</td>
                      <td>{a.tier}</td>
                      <td><span className="badge badge--red">{a.interestsSentToday}</span></td>
                      <td>{a.threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadInterests()}>
          Apply
        </button>
      </div>

      {interests.length === 0 ? (
        <div className="empty-state">
          <h3>No interest activity</h3>
          <p>No interests match your filters</p>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {interests.map((i) => (
                  <tr key={i.id}>
                    <td>#{i.sender.profileId} — {i.sender.email}</td>
                    <td>#{i.receiver.profileId} — {i.receiver.email}</td>
                    <td><span className="badge badge--blue">{i.status}</span></td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.message ?? '—'}</td>
                    <td>{formatDateTime(i.createdAt)}</td>
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
    </>
  );
}
