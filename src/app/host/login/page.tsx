'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PartnerLoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('redirect') ?? '/host/dashboard';

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
        body: JSON.stringify({ mobile, otp, role: 'host' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'OTP verification failed'); return; }
      sessionStorage.setItem('access_token', data.accessToken);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      if (data.user?.role === 'admin') router.push('/admin/dashboard');
      else                             router.push(redirect);
    } catch { setError('Network error. Please try again.'); }
    finally   { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex flex-row-reverse">

      {/* ── Right panel — value prop (amber) ── */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-amber-600 to-yellow-700 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative z-10">
          <Link href="/" className="text-2xl font-bold tracking-tight">BengalHomestay</Link>
          <p className="text-amber-200 text-sm mt-1">Partner Dashboard</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-snug">
              Manage your property,<br />grow your income
            </h2>
            <p className="text-amber-100 mt-3 text-sm leading-relaxed">
              Your partner dashboard gives you full control — listings, inquiries, bookings, and analytics in one place.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '📋', title: 'Manage your listings',    desc: 'Update photos, pricing and availability anytime'  },
              { icon: '📬', title: 'Respond to inquiries',    desc: 'Confirm or decline guest bookings instantly'       },
              { icon: '💰', title: 'Track your earnings',     desc: 'Revenue reports and booking history'               },
              { icon: '⭐', title: 'Build your reputation',   desc: 'Verified host badge boosts your visibility'        },
            ].map(b => (
              <div key={b.title} className="flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{b.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-amber-200 text-xs mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <p className="text-sm font-semibold mb-1">Free to list. Always.</p>
            <p className="text-amber-200 text-xs leading-relaxed">No upfront fees. Upgrade to Premium only when you want priority placement and advanced analytics.</p>
          </div>
        </div>

        <p className="text-amber-300 text-xs relative z-10">© 2024 BengalHomestay.com</p>
      </div>

      {/* ── Left panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-amber-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-amber-700">BengalHomestay</Link>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-8">

            {/* Header */}
            <div className="mb-7">
              <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-3">🏡 Partner Portal</span>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, Partner</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to manage your listings, respond to inquiries, and grow your homestay business.</p>
            </div>

            {/* Step 1 — Mobile */}
            {step === 'mobile' && (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered mobile number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-amber-200 rounded-l-xl bg-amber-50 text-amber-600 text-sm">+91</span>
                    <input
                      type="tel" value={mobile}
                      onChange={e => setMobile(e.target.value.replace(/\D/g,'').slice(0,10))}
                      placeholder="9876543210" autoFocus
                      className="flex-1 border border-amber-200 rounded-r-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Use the number you registered your property with</p>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-3 rounded-xl transition-colors">
                  {loading ? 'Sending OTP…' : 'Send OTP →'}
                </button>
              </form>
            )}

            {/* Step 2 — OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <p className="text-sm text-gray-500">OTP sent to <span className="font-semibold text-gray-800">+91 {mobile}</span></p>
                {devOtp && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 text-sm text-yellow-800">
                    Dev OTP: <span className="font-mono font-bold">{devOtp}</span>
                  </div>
                )}
                <input
                  type="text" inputMode="numeric" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="• • • • • •" autoFocus
                  className="w-full border border-amber-200 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" disabled={loading || otp.length !== 6}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-3 rounded-xl transition-colors">
                  {loading ? 'Verifying…' : 'Go to Dashboard →'}
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
              Not registered yet?{' '}
              <Link href="/host/register" className="text-amber-600 hover:underline font-medium">List your property for free →</Link>
            </p>
            <p className="text-sm text-gray-400">
              Looking for a homestay?{' '}
              <Link href="/login" className="text-green-700 hover:underline font-medium">Guest Login →</Link>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function PartnerLoginPage() {
  return <Suspense><PartnerLoginForm /></Suspense>;
}
