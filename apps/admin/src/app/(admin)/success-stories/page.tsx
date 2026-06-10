'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { getNextCursor, type SuccessStory } from '@/lib/types';

export default function SuccessStoriesPage() {
  const { showToast } = useToast();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const loadStories = useCallback(async (nextCursor?: string | null, append = false) => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (nextCursor) params.set('cursor', nextCursor);
    const qs = params.toString();
    const res = await apiRequest<SuccessStory[]>(`/admin/success-stories${qs ? `?${qs}` : ''}`);
    const next = getNextCursor(res.meta);
    setStories((prev) => (append ? [...prev, ...res.data] : res.data));
    setCursor(next);
    setHasMore(!!next);
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    loadStories()
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load stories', 'error'))
      .finally(() => setLoading(false));
  }, [loadStories, showToast]);

  const updateStatus = async (id: string, status: string) => {
    setActing(id);
    try {
      await apiRequest(`/admin/success-stories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setStories((prev) => prev.filter((s) => s.id !== id));
      showToast(`Story ${status}`, 'success');
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
    <>
      <div className="page-header">
        <h2>Success Stories</h2>
        <p>Review and publish member success stories</p>
      </div>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
      </div>

      {stories.length === 0 ? (
        <div className="empty-state">
          <h3>No stories</h3>
          <p>No success stories in this status</p>
        </div>
      ) : (
        <div className="story-grid">
          {stories.map((story) => (
            <div key={story.id} className="story-card">
              {story.photoUrl && (
                <img src={story.photoUrl} alt="" className="story-card__photo" />
              )}
              <div className="story-card__body">
                <p className="story-card__text">{story.testimonial}</p>
                <div className="story-card__meta">
                  {story.profile && <span>Profile #{story.profile.profileId}</span>}
                  <span>{formatDate(story.createdAt)}</span>
                  <span className={`badge badge--blue`}>{story.status}</span>
                </div>
                <div className="btn-group" style={{ marginTop: 12 }}>
                  {story.status !== 'published' && (
                    <button
                      type="button"
                      className="btn btn--success btn--sm"
                      disabled={acting === story.id}
                      onClick={() => updateStatus(story.id, 'published')}
                    >
                      Publish
                    </button>
                  )}
                  {story.status === 'published' && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      disabled={acting === story.id}
                      onClick={() => updateStatus(story.id, 'unpublished')}
                    >
                      Unpublish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="load-more">
          <button type="button" className="btn btn--secondary" onClick={() => loadStories(cursor, true)}>
            Load More
          </button>
        </div>
      )}
    </>
  );
}
