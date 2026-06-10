'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { PushBannerUpload } from '@/components/PushBannerUpload';
import { SuperAdminGuard } from '@/components/SuperAdminGuard';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { PushCampaign } from '@/lib/types';

const DEEP_LINK_SCREENS = [
  { value: 'matches', label: 'Matches' },
  { value: 'interests', label: 'Interests' },
  { value: 'shortlist', label: 'Shortlist' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'custom', label: 'Custom' },
];

export default function PushPage() {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [screen, setScreen] = useState('matches');
  const [customScreen, setCustomScreen] = useState('');
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadCampaigns = async () => {
    const res = await apiRequest<PushCampaign[]>('/admin/push/campaigns');
    setCampaigns(res.data);
  };

  useEffect(() => {
    loadCampaigns()
      .catch((err) => showToast(err instanceof Error ? err.message : 'Failed to load campaigns', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSend = async () => {
    setSending(true);
    try {
      const screenValue = screen === 'custom' ? customScreen : screen;
      const res = await apiRequest<{ campaignId: string; recipientCount: number }>('/admin/push/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
          data: { screen: screenValue },
        }),
      });
      showToast(`Broadcast sent to ${res.data.recipientCount} users`, 'success');
      setTitle('');
      setBody('');
      setImageUrl('');
      setConfirmOpen(false);
      await loadCampaigns();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Broadcast failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setConfirmOpen(true);
  };

  return (
    <SuperAdminGuard>
    <>
      <div className="page-header">
        <h2>Push Notifications</h2>
        <p>Send broadcast notifications to all users with push tokens</p>
      </div>

      <div className="card mb-4">
        <div className="card__header">
          <h3>Send Broadcast</h3>
        </div>
        <div className="card__body">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Title</label>
              <input
                id="title"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                maxLength={100}
                placeholder="Notification title"
                required
              />
              <div className={`char-counter${title.length > 90 ? ' char-counter--warn' : ''}`}>
                {title.length}/100
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="body">Body</label>
              <textarea
                id="body"
                className="form-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 250))}
                maxLength={250}
                placeholder="Notification message"
                required
              />
              <div className={`char-counter${body.length > 230 ? ' char-counter--warn' : ''}`}>
                {body.length}/250
              </div>
            </div>

            <PushBannerUpload
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
              onError={(message) => showToast(message, 'error')}
            />

            <div className="form-group">
              <label className="form-label" htmlFor="screen">Deep-link Screen</label>
              <select id="screen" className="form-select" value={screen} onChange={(e) => setScreen(e.target.value)}>
                {DEEP_LINK_SCREENS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {screen === 'custom' && (
              <div className="form-group">
                <label className="form-label" htmlFor="customScreen">Custom Screen Key</label>
                <input
                  id="customScreen"
                  className="form-input"
                  value={customScreen}
                  onChange={(e) => setCustomScreen(e.target.value)}
                  placeholder="e.g. profile_edit"
                />
              </div>
            )}

            <button type="submit" className="btn btn--primary" disabled={!title.trim() || !body.trim()}>
              Send to All Users
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h3>Past Campaigns</h3>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state"><p>No campaigns sent yet</p></div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Body</th>
                  <th>Image</th>
                  <th>Sent At</th>
                  <th>Recipients</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const campaignImage =
                    c.data && typeof c.data === 'object' && 'imageUrl' in c.data
                      ? String((c.data as { imageUrl?: string }).imageUrl ?? '')
                      : '';
                  return (
                    <tr key={c.id}>
                      <td><strong>{c.title}</strong></td>
                      <td style={{ maxWidth: 280 }}>{c.body}</td>
                      <td>{campaignImage ? '✅' : '—'}</td>
                      <td>{formatDateTime(c.sentAt)}</td>
                      <td>{c.recipientCount.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmOpen && (
        <Modal
          title="Confirm Broadcast"
          onClose={() => !sending && setConfirmOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmOpen(false)} disabled={sending}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending…' : 'Confirm & Send'}
              </button>
            </>
          }
        >
          <p style={{ marginBottom: 16, fontSize: 14 }}>
            You are about to send a push notification to <strong>all users with push tokens</strong>.
          </p>
          {imageUrl && (
            <div className="image-upload-preview" style={{ marginBottom: 16 }}>
              <img src={imageUrl} alt="Broadcast banner preview" />
            </div>
          )}
          <div className="detail-section">
            <div className="detail-row"><span className="detail-row__label">Title</span><span className="detail-row__value">{title}</span></div>
            <div className="detail-row"><span className="detail-row__label">Body</span><span className="detail-row__value">{body}</span></div>
            {imageUrl && (
              <div className="detail-row">
                <span className="detail-row__label">Banner</span>
                <span className="detail-row__value" style={{ wordBreak: 'break-all', fontSize: 11 }}>{imageUrl}</span>
              </div>
            )}
            <div className="detail-row"><span className="detail-row__label">Screen</span><span className="detail-row__value">{screen === 'custom' ? customScreen : screen}</span></div>
          </div>
        </Modal>
      )}
    </>
    </SuperAdminGuard>
  );
}
