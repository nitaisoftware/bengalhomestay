'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'details' | 'otp' | 'done';

export default function HostRegisterPage() {
  const router = useRouter();

  const [step, setStep]       = useState<Step>('details');
  const [name, setName]       = useState('');
  const [mobile, setMobile]   = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [devOtp, setDevOtp]   = useState(''); // shown only in dev mode

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!/^[6-9]\d{9}$/.test(mobile)) { setError('Enter a valid 10-digit mobile number'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/otp/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mobile }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? 'Failed to send OTP'); return; }

      if (data.dev_otp) setDevOtp(data.dev_otp); // dev convenience
      setStep('otp');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/otp/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mobile, otp, name, role: 'host' }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? 'OTP verification failed'); return; }

      // Store access token in sessionStorage
      sessionStorage.setItem('access_token', data.accessToken);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      setStep('done');
      setTimeout(() => router.push('/host/dashboard'), 1500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-green-700">
            BengalHomestay
          </Link>
          <p className="text-gray-500 mt-1 text-sm">List your property, reach thousands of guests</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {(['details', 'otp', 'done'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step === s
                    ? 'bg-green-700 text-white'
                    : i < (['details', 'otp', 'done'] as Step[]).indexOf(step)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-gray-200 w-8" />}
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-2">
              {step === 'details' ? 'Your details' : step === 'otp' ? 'Verify OTP' : 'Done!'}
            </span>
          </div>

          {/* ── Step 1: Details ── */}
          {step === 'details' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Create host account</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ravi Kumar"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
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

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Enter OTP</h2>
              <p className="text-sm text-gray-500">
                A 6-digit OTP was sent to <span className="font-medium text-gray-700">+91 {mobile}</span>
              </p>

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
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('details'); setOtp(''); setError(''); }}
                className="w-full text-sm text-gray-400 hover:text-gray-600"
              >
                Change mobile number
              </button>
            </form>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Account created!</h2>
              <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
            </div>
          )}

        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-green-700 hover:underline">Sign in</Link>
        </p>

      </div>
    </main>
  );
}
