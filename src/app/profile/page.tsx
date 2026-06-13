'use client';

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import Link                    from 'next/link';

const WB_DISTRICTS = [
  'Alipurduar','Bankura','Bardhaman','Birbhum','Cooch Behar','Dakshin Dinajpur',
  'Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong',
  'Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas','Paschim Medinipur',
  'Purba Medinipur','Purulia','South 24 Parganas','Uttar Dinajpur',
];

interface Profile {
  id:       string;
  name:     string | null;
  mobile:   string | null;
  email:    string | null;
  role:     string;
  gender:   string | null;
  dob:      string | null;
  address:  string | null;
  city:     string | null;
  district: string | null;
  state:    string | null;
  pincode:  string | null;
  createdAt:string;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  // form fields
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [gender,   setGender]   = useState('');
  const [dob,      setDob]      = useState('');
  const [address,  setAddress]  = useState('');
  const [city,     setCity]     = useState('');
  const [district, setDistrict] = useState('');
  const [state,    setState]    = useState('West Bengal');
  const [pincode,  setPincode]  = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { router.push('/login?redirect=/profile'); return; }
    fetchProfile(token);
  }, []);

  async function fetchProfile(token: string) {
    try {
      const res  = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { router.push('/login?redirect=/profile'); return; }
      const data = await res.json();
      const u    = data.user as Profile;
      setProfile(u);
      setName(u.name     ?? '');
      setEmail(u.email   ?? '');
      setGender(u.gender ?? '');
      setDob(u.dob ? u.dob.split('T')[0] : '');
      setAddress(u.address  ?? '');
      setCity(u.city        ?? '');
      setDistrict(u.district?? '');
      setState(u.state      ?? 'West Bengal');
      setPincode(u.pincode  ?? '');
    } finally { setLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = sessionStorage.getItem('access_token') ?? '';
      const res   = await fetch('/api/auth/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email, gender, dob: dob || null, address, city, district, state, pincode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return; }
      // Update sessionStorage name
      const stored = sessionStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        sessionStorage.setItem('user', JSON.stringify({ ...u, name: data.user.name ?? u.name }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading profile…</div>
      </div>
    );
  }

  const roleLabel = profile?.role === 'host' ? '🏡 Partner' : profile?.role === 'admin' ? '🔐 Admin' : '🧳 Guest';
  const roleColor = profile?.role === 'host' ? 'bg-amber-100 text-amber-700' : profile?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Home</Link>
        <span className="text-gray-200">|</span>
        <span className="text-sm font-medium text-gray-700">My Profile</span>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold shrink-0">
            {(name || profile?.mobile || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{name || 'Your Profile'}</h1>
            <p className="text-sm text-gray-400">{profile?.mobile ? `+91 ${profile.mobile}` : profile?.email ?? ''}</p>
            <span className={`mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleColor}`}>{roleLabel}</span>
          </div>
          <div className="text-right text-xs text-gray-400 shrink-0">
            <p>Member since</p>
            <p className="font-medium text-gray-600">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">

          {/* Personal Info */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-800 border-b border-gray-50 pb-3">Personal Information</h2>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-400">*</span></label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Rajan Ghosh" required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {/* Mobile (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-400 text-sm">+91</span>
                <input
                  type="text" value={profile?.mobile ?? ''} readOnly
                  className="flex-1 border border-gray-200 rounded-r-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Mobile number cannot be changed — it is used for login.</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {/* Gender + DOB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={gender} onChange={e => setGender(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="date" value={dob} onChange={e => setDob(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-800 border-b border-gray-50 pb-3">Address</h2>

            {/* Street / Village */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street / Village / Locality</label>
              <input
                type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 12 Rabindra Sarani, Shyambazar"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            {/* City + District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City / Town</label>
                <input
                  type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Kolkata"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select
                  value={district} onChange={e => setDistrict(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                >
                  <option value="">Select district</option>
                  {WB_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  <option value="Other">Other (outside WB)</option>
                </select>
              </div>
            </div>

            {/* State + Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text" value={state} onChange={e => setState(e.target.value)}
                  placeholder="West Bengal"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text" value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="700001" maxLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>
          </section>

          {/* Error / Success */}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {saved  && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 text-center font-medium">
              ✅ Profile saved successfully!
            </div>
          )}

          {/* Save button */}
          <button
            type="submit" disabled={saving}
            className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>

        </form>
      </main>
    </div>
  );
}
