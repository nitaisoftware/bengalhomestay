'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

type Step = 'mobile' | 'otp';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('redirect') ?? '';

  const [step,    setStep]    = useState<Step>('mobile');
  const [mobile,  setMobile]  = useState('');
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [devOtp,  setDevOtp]  = useState('');

  // ── Step 1: Send OTP ──────────────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/otp/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mobile }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to send OTP');
        return;
      }

      if (data.dev_otp) setDevOtp(data.dev_otp);
      setStep('otp');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/otp/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'OTP verification failed');
        return;
      }

      sessionStorage.setItem('access_token', data.accessToken);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role or ?redirect= param
      if (redirect) {
        router.push(redirect);
      } else if (data.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (data.user?.role === 'host') {
        router.push('/host/dashboard');
      } else {
        router.push('/');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-green-700">
            BengalHomestay
          </Link>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* ── Mobile entry ── */}
          {step === 'mobile' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    autoFocus
                    className="flex-1 border border-gray-200 rounded-r-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* ── OTP entry ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Enter OTP</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Sent to{' '}
                  <span className="font-medium text-gray-700">+91 {mobile}</span>
                </p>
              </div>

              {devOtp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
                  Dev mode OTP: <span className="font-mono font-bold">{devOtp}</span>
                </div>
              )}

              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading ? 'Verifying...' : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('mobile'); setOtp(''); setError(''); setDevOtp(''); }}
                className="w-full text-sm text-gray-400 hover:text-gray-600"
              >
                ← Change number
              </button>
            </form>
          )}

        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          New host?{' '}
          <Link href="/host/register" className="text-green-700 hover:underline">
            Create an account
          </Link>
        </p>

      </div>
    </main>
  );
}

// Wrap in Suspense because useSearchParams requires it in Next.js 14+
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
