'use client';

import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { SuperAdminGuard } from '@/components/SuperAdminGuard';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/api';

const SEGMENTS = [
  { value: 'all', label: 'All active users' },
  { value: 'paid', label: 'Paid users' },
  { value: 'free', label: 'Free users' },
  { value: 'inactive_30d', label: 'Inactive 30+ days' },
] as const;

export default function BroadcastPage() {
  const { showToast } = useToast();
  const [segment, setSegment] = useState<string>('all');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      const res = await apiRequest<{ segment: string; recipientCount: number }>('/admin/email/broadcast', {
        method: 'POST',
        body: JSON.stringify({ segment, subject, bodyHtml }),
      });
      showToast(`Broadcast sent to ${res.data.recipientCount} recipients`, 'success');
      setShowConfirm(false);
      setSubject('');
      setBodyHtml('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Broadcast failed', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <SuperAdminGuard>
      <div className="page-header">
        <h2>Email Broadcast</h2>
        <p>Send email campaigns to member segments via Resend</p>
      </div>

      <div className="card">
        <div className="card__body">
          <div className="form-group">
            <label>Segment</label>
            <select className="form-input" value={segment} onChange={(e) => setSegment(e.target.value)}>
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              className="form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
            />
          </div>

          <div className="form-group">
            <label>Body (HTML)</label>
            <textarea
              className="form-input"
              rows={12}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="<p>Your message here…</p>"
            />
          </div>

          {bodyHtml && (
            <div className="form-group">
              <label>Preview</label>
              <div className="email-preview" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            </div>
          )}

          <button
            type="button"
            className="btn btn--primary"
            disabled={!subject.trim() || !bodyHtml.trim()}
            onClick={() => setShowConfirm(true)}
          >
            Review & Send
          </button>
        </div>
      </div>

      {showConfirm && (
        <Modal title="Confirm Broadcast" onClose={() => setShowConfirm(false)}>
          <p><strong>Segment:</strong> {SEGMENTS.find((s) => s.value === segment)?.label}</p>
          <p><strong>Subject:</strong> {subject}</p>
          <p style={{ marginTop: 12, color: 'var(--brand-muted)' }}>
            This will send to all matching users. Continue?
          </p>
          <div className="btn-group" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn--primary" disabled={sending} onClick={send}>
              {sending ? 'Sending…' : 'Send Broadcast'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setShowConfirm(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </SuperAdminGuard>
  );
}
