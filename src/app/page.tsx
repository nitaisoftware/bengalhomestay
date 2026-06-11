'use client';

import { useRouter } from 'next/navigation';
import { useState }  from 'react';
import Link          from 'next/link';

const DISTRICTS = [
  'Darjeeling','Kalimpong','Jalpaiguri','Alipurduar','Cooch Behar',
  'Malda','Murshidabad','Birbhum','Bankura','Purulia','Jhargram',
  'West Midnapore','East Midnapore','South 24 Parganas',
  'North 24 Parganas','Nadia','Hooghly','Howrah','Kolkata','Sundarbans',
];

const CATEGORIES = [
  { label: 'Wildlife',   slug: 'wildlife-sanctuaries', icon: '🐯', sub: 'Sanctuaries & Parks', color: 'bg-green-50' },
  { label: 'Heritage',   slug: 'monuments',            icon: '🏛️', sub: 'Palaces & Forts',     color: 'bg-amber-50' },
  { label: 'Spiritual',  slug: 'hinduism',             icon: '🪔', sub: 'Temples & Ashrams',   color: 'bg-orange-50' },
  { label: 'Adventure',  slug: 'hiking-trekking',      icon: '🥾', sub: 'Treks & Rafting',     color: 'bg-blue-50'  },
  { label: 'Rural',      slug: 'eco-tourism',          icon: '🌾', sub: 'Farms & Villages',    color: 'bg-lime-50'  },
  { label: 'Nature',     slug: 'hills-mountains',      icon: '🌿', sub: 'Hills & Rivers',      color: 'bg-teal-50'  },
];

const POPULAR = ['Darjeeling','Sundarbans','Kalimpong','Digha','Murshidabad','Purulia'];

export default function HomePage() {
  const router   = useRouter();
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState('');

  function doSearch() {
    const params = new URLSearchParams();
    if (district) params.set('district', district);
    if (category) params.set('category', category);
    router.push(`/homestays${params.toString() ? '?' + params.toString() : ''}`);
  }

  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section
        className="min-h-screen flex flex-col justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(14,63,44,0.85) 0%, rgba(21,98,67,0.70) 50%, rgba(212,146,26,0.50) 100%),
            url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&q=80') center/cover no-repeat`,
        }}
      >
        {/* Floating badges */}
        <div className="absolute top-28 right-8 md:right-16 hidden md:block animate-bounce">
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 text-white text-center shadow-lg">
            <div className="text-2xl font-bold">500+</div>
            <div className="text-xs opacity-80">Verified Homestays</div>
          </div>
        </div>
        <div className="absolute bottom-32 right-12 hidden md:block" style={{ animationDelay: '.8s' }}>
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 text-white text-center shadow-lg">
            <div className="text-2xl font-bold">22</div>
            <div className="text-xs opacity-80">Districts Covered</div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-16 w-full">
          {/* Headline */}
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur border border-white/25 rounded-full px-4 py-1.5 text-white text-sm mb-5">
              <span className="text-yellow-300">📍</span>
              <span>West Bengal&apos;s #1 Homestay Directory</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
              Experience the Soul<br />
              <span className="text-yellow-300">of Bengal</span>
            </h1>
            <p className="text-white/85 text-lg md:text-xl font-light max-w-xl">
              From Darjeeling&apos;s misty mountains to Sundarbans&apos; mangrove forests — discover authentic homestays with real Bengali families.
            </p>
          </div>

          {/* Search card */}
          <div className="rounded-3xl p-5 md:p-6 max-w-4xl backdrop-blur-md bg-white/10 border border-white/25">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white/90 rounded-2xl px-4 py-3">
                <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-1">📍 District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-transparent text-gray-800 text-sm font-medium focus:outline-none"
                >
                  <option value="">All Districts</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="bg-white/90 rounded-2xl px-4 py-3">
                <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-1">🏷️ Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent text-gray-800 text-sm font-medium focus:outline-none"
                >
                  <option value="">All Types</option>
                  {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </div>
              <button
                onClick={doSearch}
                className="bg-green-700 hover:bg-green-600 text-white rounded-2xl px-6 py-3 font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                🔍 Search Stays
              </button>
            </div>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <span className="text-white/70 text-xs">Popular:</span>
              {POPULAR.map((p) => (
                <button
                  key={p}
                  onClick={() => router.push(`/homestays?district=${encodeURIComponent(p)}`)}
                  className="bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-6 mt-8 text-white/80 text-sm">
            <span className="flex items-center gap-1.5">✅ Admin-verified listings</span>
            <span className="flex items-center gap-1.5">🛡️ Secure contact</span>
            <span className="flex items-center gap-1.5">⭐ Reviewed by real guests</span>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-green-700 text-sm font-semibold uppercase tracking-widest">Explore by Interest</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">What Kind of Journey?</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Every corner of West Bengal tells a different story. Choose yours.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/homestays?category=${c.slug}`}
                className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md border border-gray-100 hover:-translate-y-1 transition-all block"
              >
                <div className={`w-14 h-14 rounded-2xl ${c.color} flex items-center justify-center mx-auto mb-3 text-2xl`}>
                  {c.icon}
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{c.label}</h3>
                <p className="text-xs text-gray-500">{c.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Districts ── */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Browse by District</h2>
            <p className="text-gray-500 mt-2">22 districts, thousands of stories</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {DISTRICTS.map((d) => (
              <Link
                key={d}
                href={`/homestays?district=${encodeURIComponent(d)}`}
                className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-green-700 hover:text-white hover:border-green-700 transition-all"
              >
                {d}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: '🔍', title: 'Search',  desc: 'Filter by district, category, price and amenities' },
              { icon: '📞', title: 'Contact', desc: 'Sign in and contact the host directly — no middlemen' },
              { icon: '🏡', title: 'Stay',    desc: 'Enjoy an authentic Bengali homestay experience'      },
            ].map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="text-5xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Own a Homestay in West Bengal?</h2>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto">List your property for free and reach thousands of travellers. No commission, no hidden fees.</p>
        <Link
          href="/host/register"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
        >
          List Your Property — Free
        </Link>
      </section>

    </div>
  );
}
