'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sendAdminOtp, verifyAdminOtp } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await sendAdminOtp(email.trim().toLowerCase());
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await verifyAdminOtp(email.trim().toLowerCase(), otp.trim());
      login(res.data.token, res.data.admin);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="login-page">
        <div className="loading-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo">
          <h1>Gahoi Sarthi Admin</h1>
          <p>Sign in with your admin email</p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="admin@gahoisarthi.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p className="text-muted mb-4" style={{ fontSize: 13 }}>
              OTP sent to <strong>{email}</strong>
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="otp">
                6-digit OTP
              </label>
              <input
                id="otp"
                type="text"
                className="form-input otp-input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                autoFocus
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }} disabled={submitting || otp.length < 6}>
              {submitting ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => {
                setStep('email');
                setOtp('');
                setError('');
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
