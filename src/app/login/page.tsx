'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function GuestLoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('redirect') ?? '';

  const [step,    setStep]    = useState<'mobile' | 'otp'>('mobile');
  const [mobile,  setMobile]  = useState('');
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [devOtp,  setDevOtp]  = useState('');

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(mobile)) { setError('Enter a valid 10-digit mobile number'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to send OTP'); return; }
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setStep('otp');
    } catch { setError('Network error. Please try again.'); }
    finally   { setLoading(false); }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp, role: 'guest' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'OTP verification failed'); return; }
      sessionStorage.setItem('access_token', data.accessToken);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      // Auto-submit any pending inquiry saved before redirect
      const pendingRaw = sessionStorage.getItem('pending_inquiry');
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          if (pending.homestayId && pending.checkIn && pending.checkOut) {
            await fetch('/api/bookings', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.accessToken}` },
              body:    JSON.stringify({
                homestayId: pending.homestayId,
                checkIn:    pending.checkIn,
                checkOut:   pending.checkOut,
                guests:     pending.guests ?? 2,
                message:    pending.message ?? '',
              }),
            });
          }
          sessionStorage.removeItem('pending_inquiry');
          router.push('/my-bookings?inquiry_sent=1');
          return;
        } catch {
          sessionStorage.removeItem('pending_inquiry');
          // fall through to normal redirect
        }
      }

      if (redirect)                        router.push(redirect);
      else if (data.user?.role === 'admin') router.push('/admin/dashboard');
      else if (data.user?.role === 'host')  router.push('/host/dashboard');
      else                                  router.push('/');
    } catch { setError('Network error. Please try again.'); }
    finally   { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex">

      {/* ── Left panel — value prop ── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-green-800 to-emerald-900 text-white p-12 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative z-10">
          <Link href="/" className="text-2xl font-bold tracking-tight">BengalHomestay</Link>
          <p className="text-green-300 text-sm mt-1">West Bengal&apos;s #1 Homestay Directory</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-snug">
              Your next Bengal<br />adventure starts here
            </h2>
            <p className="text-green-200 mt-3 text-sm leading-relaxed">
              Sign in to save favourites, send booking inquiries, and manage your stays — all in one place.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '🔍', title: 'Browse 500+ homestays',    desc: 'From Darjeeling to Sundarbans'        },
              { icon: '💬', title: 'Message hosts directly',   desc: 'No middlemen, no extra fees'          },
              { icon: '📅', title: 'Track your bookings',      desc: 'All your stays in one dashboard'      },
              { icon: '⭐', title: 'Leave reviews',            desc: 'Help fellow travellers discover gems' },
            ].map(b => (
              <div key={b.title} className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{b.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-green-300 text-xs mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-green-400 text-xs relative z-10">
          © 2024 BengalHomestay.com
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-green-700">BengalHomestay</Link>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

            {/* Header */}
            <div className="mb-7">
              <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3">🧳 Guest Portal</span>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, traveller</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to browse and book authentic homestays across West Bengal.</p>
            </div>

            {/* Step 1 — Mobile */}
            {step === 'mobile' && (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-500 text-sm">+91</span>
                    <input
                      type="tel" value={mobile}
                      onChange={e => setMobile(e.target.value.replace(/\D/g,'').slice(0,10))}
                      placeholder="9876543210" autoFocus
                      className="flex-1 border border-gray-200 rounded-r-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                      required
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors">
                  {loading ? 'Sending OTP…' : 'Send OTP →'}
                </button>
              </form>
            )}

            {/* Step 2 — OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <p className="text-sm text-gray-500">OTP sent to <span className="font-semibold text-gray-800">+91 {mobile}</span></p>
                </div>
                {devOtp && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 text-sm text-yellow-800">
                    Dev OTP: <span className="font-mono font-bold">{devOtp}</span>
                  </div>
                )}
                <input
                  type="text" inputMode="numeric" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="• • • • • •" autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" disabled={loading || otp.length !== 6}
                  className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors">
                  {loading ? 'Verifying…' : 'Sign In →'}
                </button>
                <button type="button" onClick={() => { setStep('mobile'); setOtp(''); setError(''); }}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 py-1">
                  ← Change number
                </button>
              </form>
            )}

          </div>

          {/* Footer links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              New to BengalHomestay?{' '}
              <Link href="/login" className="text-green-700 hover:underline font-medium">Sign up with OTP — it&apos;s free</Link>
            </p>
            <p className="text-sm text-gray-400">
              Are you a homestay owner?{' '}
              <Link href="/host/login" className="text-amber-600 hover:underline font-medium">Partner Login →</Link>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function GuestLoginPage() {
  return <Suspense><GuestLoginForm /></Suspense>;
}
