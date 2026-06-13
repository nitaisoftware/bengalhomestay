'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link          from 'next/link';
import { Suspense }  from 'react';

// ── Constants ──────────────────────────────────────────────────────────────
const DISTRICTS = [
  'Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur',
  'Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong',
  'Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas',
  'Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur',
  'Purulia','South 24 Parganas','Uttar Dinajpur',
];

const PROPERTY_TYPES = [
  { value: 'Home',         label: 'Home Stay',      icon: '🏡' },
  { value: 'Guest House',  label: 'Guest House',     icon: '🏘️' },
  { value: 'Farm Stay',    label: 'Farm Stay',       icon: '🌾' },
  { value: 'Heritage Home',label: 'Heritage Home',   icon: '🏛️' },
  { value: 'Resort',       label: 'Eco Resort',      icon: '🌿' },
];

type Step = 'details' | 'otp' | 'property' | 'done';

// ── Left panel ─────────────────────────────────────────────────────────────
function ValuePanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-green-800 text-white p-10 rounded-2xl">
      <div>
        <Link href="/" className="text-2xl font-bold tracking-tight">
          BengalHomestay
        </Link>
        <p className="mt-1 text-green-300 text-sm">West Bengal&apos;s homestay marketplace</p>

        <div className="mt-10 space-y-6">
          <h2 className="text-2xl font-bold leading-snug">
            List your property,<br />
            reach thousands of guests
          </h2>

          <div className="space-y-4">
            {[
              { icon: '🆓', title: 'Free to list',        desc: 'No upfront cost. Start earning immediately.' },
              { icon: '📞', title: 'Direct contact',      desc: 'Guests contact you directly — no middlemen.' },
              { icon: '⭐', title: 'Premium visibility',   desc: 'Upgrade for top placement and featured badge.' },
              { icon: '🗺️', title: 'All of West Bengal',  desc: 'From Darjeeling to Sundarbans, we cover it all.' },
            ].map(b => (
              <div key={b.title} className="flex gap-3">
                <span className="text-2xl shrink-0">{b.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{b.title}</p>
                  <p className="text-green-300 text-xs mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-green-700 pt-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { value: '880+', label: 'Listed homestays' },
            { value: '23',   label: 'Districts covered' },
            { value: 'Free', label: 'To get started' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-green-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step indicator ──────────────────────────────────────────────────────────
const STEPS: { id: Step; label: string }[] = [
  { id: 'details',  label: 'Details'  },
  { id: 'otp',      label: 'Verify'   },
  { id: 'property', label: 'Property' },
  { id: 'done',     label: 'Done'     },
];

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            i < idx  ? 'bg-green-600 text-white'
            : i === idx ? 'bg-green-700 text-white ring-2 ring-green-200'
            : 'bg-gray-100 text-gray-400'
          }`}>
            {i < idx ? '✓' : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-6 ${i < idx ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
      <span className="text-xs text-gray-400 ml-2">
        {STEPS.find(s => s.id === current)?.label}
      </span>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
function HostRegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const incomplete   = searchParams.get('incomplete') === '1';

  const [step,         setStep]         = useState<Step>('details');
  const [name,         setName]         = useState('');
  const [mobile,       setMobile]       = useState('');
  const [email,        setEmail]        = useState('');
  const [otp,          setOtp]          = useState('');
  const [devOtp,       setDevOtp]       = useState('');
  const [propertyType, setPropertyType] = useState('Home');
  const [district,     setDistrict]     = useState('');
  const [rooms,        setRooms]        = useState('1');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [accessToken,  setAccessToken]  = useState('');

  // ── Step 1 → send OTP ────────────────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim())                         { setError('Please enter your full name'); return; }
    if (!/^[6-9]\d{9}$/.test(mobile))        { setError('Enter a valid 10-digit mobile number'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError('Enter a valid email address or leave it blank'); return;
    }

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

  // ── Step 2 → verify OTP ──────────────────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp, name, role: 'host' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'OTP verification failed'); return; }

      const token = data.accessToken;
      sessionStorage.setItem('access_token', token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      setAccessToken(token);

      // Save email if provided
      if (email) {
        fetch('/api/auth/profile', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email }),
        });
      }

      setStep('property');
    } catch { setError('Network error. Please try again.'); }
    finally   { setLoading(false); }
  }

  // ── Step 3 → save property info + mark onboarding complete ─────────────
  async function handlePropertyContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!district) { setError('Please select your district'); return; }

    setLoading(true);
    try {
      // Mark onboarding complete in DB — this is the gate for listing creation
      await fetch('/api/auth/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ onboardingComplete: true }),
      });

      // Pre-fill data for listing creation page
      sessionStorage.setItem('host_onboarding', JSON.stringify({
        propertyType,
        district,
        rooms: parseInt(rooms, 10),
      }));

      // Update stored user object
      const stored = sessionStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        sessionStorage.setItem('user', JSON.stringify({ ...u, onboardingComplete: true }));
      }

      setStep('done');
      setTimeout(() => router.push('/host/dashboard'), 1800);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6">

        <ValuePanel />

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Mobile logo (visible on small screens only) */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="text-xl font-bold text-green-700">BengalHomestay</Link>
            <p className="text-xs text-gray-400 mt-0.5">List your property · Reach guests</p>
          </div>

          {incomplete && step === 'details' && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
              ⚠️ Please complete all registration steps before adding a listing.
            </div>
          )}

          <StepBar current={step} />

          {/* ── Step 1: Details ── */}
          {step === 'details' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Create your host account to list your property</h2>
              <p className="text-sm text-gray-500">Free forever. No credit card required.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name <span className="text-red-400">*</span></label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Rabi Das" autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number <span className="text-red-400">*</span></label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-500 text-sm">+91</span>
                  <input
                    type="tel" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g,'').slice(0,10))}
                    placeholder="9876543210"
                    className="flex-1 border border-gray-200 rounded-r-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">OTP will be sent to this number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Sending OTP…' : 'Continue →'}
              </button>

              <p className="text-xs text-center text-gray-400">
                By continuing you agree to our{' '}
                <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
              </p>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verify your number</h2>
                <p className="text-sm text-gray-500 mt-1">
                  OTP sent to <span className="font-semibold text-gray-700">+91 {mobile}</span>
                </p>
              </div>

              {devOtp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 text-sm text-yellow-800">
                  Dev OTP: <span className="font-mono font-bold tracking-widest">{devOtp}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-digit OTP</label>
                <input
                  type="text" inputMode="numeric" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="• • • • • •" autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Verifying…' : 'Verify & Continue →'}
              </button>

              <button
                type="button" onClick={() => { setStep('details'); setOtp(''); setError(''); }}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
              >
                ← Change mobile number
              </button>
            </form>
          )}

          {/* ── Step 3: Property info ── */}
          {step === 'property' && (
            <form onSubmit={handlePropertyContinue} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tell us about your property</h2>
                <p className="text-sm text-gray-500 mt-1">This helps us set up your listing correctly.</p>
              </div>

              {/* Property type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property type</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button
                      key={pt.value} type="button"
                      onClick={() => setPropertyType(pt.value)}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                        propertyType === pt.value
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{pt.icon}</span>
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Homestay Location <span className="text-red-400">*</span></label>
                <select
                  value={district} onChange={e => { setDistrict(e.target.value); setError(''); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                >
                  <option value="">Select district…</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Number of rooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of guest rooms
                  <span className="font-normal text-gray-400 ml-1">(approx.)</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRooms(r => String(Math.max(1, parseInt(r) - 1)))}
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-lg"
                  >−</button>
                  <span className="text-2xl font-bold text-green-700 w-8 text-center">{rooms}</span>
                  <button
                    type="button"
                    onClick={() => setRooms(r => String(Math.min(50, parseInt(r) + 1)))}
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-lg"
                  >+</button>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Saving…' : 'Go to my dashboard →'}
              </button>
            </form>
          )}

          {/* ── Step 4: Done ── */}
          {step === 'done' && (
            <div className="text-center py-8 space-y-3">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome aboard, {name.split(' ')[0]}!</h2>
              <p className="text-sm text-gray-500">Your host account is ready. Taking you to your dashboard…</p>
              <div className="flex justify-center mt-4">
                <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer link */}
      <p className="fixed bottom-4 left-0 right-0 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-green-700 hover:underline font-medium">Sign in</Link>
      </p>
    </main>
  );
}

export default function HostRegisterPage() {
  return (
    <Suspense>
      <HostRegisterForm />
    </Suspense>
  );
}
