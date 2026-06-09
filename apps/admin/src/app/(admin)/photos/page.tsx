'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatDate, photoUrl } from '@/lib/format';
import { getNextCursor, type PendingPhoto } from '@/lib/types';

export default function PhotosPage() {
  const { showToast } = useToast();
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingPhoto | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadPhotos = useCallback(async (nextCursor?: string | null, append = false) => {
    const params = nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : '';
    const res = await apiRequest<PendingPhoto[]>(`/admin/photos${params}`);
    const next = getNextCursor(res.meta);
    setPhotos((prev) => (append ? [...prev, ...res.data] : res.data));
    setCursor(next);
    setHasMore(!!next);
  }, []);

  useEffect(() => {
    loadPhotos()
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load photos', 'error'))
      .finally(() => setLoading(false));
  }, [loadPhotos, showToast]);

  const moderate = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    setActing(id);
    try {
      await apiRequest(`/admin/photos/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
      });
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      showToast(`Photo ${status}`, 'success');
      setRejectTarget(null);
      setRejectReason('');
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
      await loadPhotos(cursor, true);
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
        <h2>Photo Moderation</h2>
        <p>Review pending profile gallery uploads</p>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🖼</div>
          <h3>All caught up</h3>
          <p>No photos pending moderation</p>
        </div>
      ) : (
        <>
          <div className="photo-grid">
            {photos.map((photo) => {
              const url = photo.signedUrl || photoUrl(photo.r2Key);
              return (
                <div key={photo.id} className="photo-card">
                  {url ? (
                    <img src={url} alt="Pending profile photo" className="photo-card__image" />
                  ) : (
                    <div className="photo-card__placeholder">
                      Photo preview unavailable
                      <br />
                      <small>{photo.r2Key}</small>
                    </div>
                  )}
                  <div className="photo-card__body">
                    <div className="photo-card__meta">
                      <div><strong>#{photo.profile.profileId}</strong></div>
                      <div>{photo.profile.user.email}</div>
                      <div>Uploaded {formatDate(photo.createdAt)}</div>
                    </div>
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn btn--success btn--sm"
                        disabled={acting === photo.id}
                        onClick={() => moderate(photo.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        disabled={acting === photo.id}
                        onClick={() => setRejectTarget(photo)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {rejectTarget && (
        <Modal
          title="Reject Photo"
          onClose={() => {
            setRejectTarget(null);
            setRejectReason('');
          }}
          footer={
            <>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                disabled={acting === rejectTarget.id}
                onClick={() => moderate(rejectTarget.id, 'rejected', rejectReason || undefined)}
              >
                Reject Photo
              </button>
            </>
          }
        >
          <p className="text-muted mb-4" style={{ fontSize: 13 }}>
            Rejecting photo for <strong>{rejectTarget.profile.user.email}</strong>. The user will receive an email and push notification.
          </p>
          <div className="form-group">
            <label className="form-label" htmlFor="reason">Reason (optional)</label>
            <textarea
              id="reason"
              className="form-textarea"
              placeholder="Does not match our photo guidelines…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
