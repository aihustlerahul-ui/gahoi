'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatDate, statusBadgeClass } from '@/lib/format';
import { getNextCursor, type RevenueSummary, type Subscription } from '@/lib/types';

export default function RevenuePage() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadSubscriptions = useCallback(async (nextCursor?: string | null, append = false) => {
    const params = nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : '';
    const res = await apiRequest<Subscription[]>(`/admin/subscriptions${params}`);
    const next = getNextCursor(res.meta);
    setSubscriptions((prev) => (append ? [...prev, ...res.data] : res.data));
    setCursor(next);
    setHasMore(!!next);
  }, []);

  useEffect(() => {
    Promise.all([
      apiRequest<RevenueSummary>('/admin/revenue'),
      loadSubscriptions(),
    ])
      .then(([revRes]) => setSummary(revRes.data))
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load revenue', 'error'))
      .finally(() => setLoading(false));
  }, [loadSubscriptions, showToast]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadSubscriptions(cursor, true);
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
        <h2>Revenue & Payments</h2>
        <p>Subscription revenue and transaction history</p>
      </div>

      {summary && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card__label">Total Revenue</div>
            <div className="stat-card__value stat-card__value--primary">{formatCurrency(summary.totalRevenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Active Subscriptions</div>
            <div className="stat-card__value">{summary.activeSubscriptions}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Revenue This Month</div>
            <div className="stat-card__value stat-card__value--gold">{formatCurrency(summary.monthlyRevenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">Total Paid Transactions</div>
            <div className="stat-card__value">{summary.totalPaidCount}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card__header">
          <h3>Transaction History</h3>
        </div>
        {subscriptions.length === 0 ? (
          <div className="empty-state"><p>No transactions yet</p></div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Order ID</th>
                    <th>Payment ID</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td><code style={{ fontSize: 11 }}>{sub.userId.slice(0, 8)}…</code></td>
                      <td>{sub.plan.name}</td>
                      <td>{formatCurrency(sub.plan.priceInr)}</td>
                      <td><code style={{ fontSize: 11 }}>{sub.razorpayOrderId}</code></td>
                      <td>{sub.razorpayPaymentId ? <code style={{ fontSize: 11 }}>{sub.razorpayPaymentId}</code> : '—'}</td>
                      <td>{formatDate(sub.createdAt)}</td>
                      <td><span className={`badge ${statusBadgeClass(sub.status)}`}>{sub.status}</span></td>
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
      </div>
    </>
  );
}
