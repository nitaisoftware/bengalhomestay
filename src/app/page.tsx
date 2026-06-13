'use client';

import { useRouter } from 'next/navigation';
import { useState }  from 'react';
import Link          from 'next/link';

const DISTRICTS = [
  { name: 'Darjeeling',        icon: '⛰️' },
  { name: 'Kalimpong',         icon: '🌲' },
  { name: 'Jalpaiguri',        icon: '🍃' },
  { name: 'Alipurduar',        icon: '🐾' },
  { name: 'Cooch Behar',       icon: '🏛️' },
  { name: 'Malda',             icon: '🏰' },
  { name: 'Murshidabad',       icon: '🕌' },
  { name: 'Birbhum',           icon: '🎵' },
  { name: 'Bankura',           icon: '🏺' },
  { name: 'Purulia',           icon: '🔥' },
  { name: 'Jhargram',          icon: '🌳' },
  { name: 'West Midnapore',    icon: '🌾' },
  { name: 'East Midnapore',    icon: '🏖️' },
  { name: 'South 24 Parganas', icon: '🌊' },
  { name: 'North 24 Parganas', icon: '🏙️' },
  { name: 'Nadia',             icon: '🌺' },
  { name: 'Hooghly',           icon: '⛵' },
  { name: 'Howrah',            icon: '🌉' },
  { name: 'Kolkata',           icon: '🏙️' },
  { name: 'Bardhaman',         icon: '🌿' },
  { name: 'Sundarbans',        icon: '🐯' },
  { name: 'Siliguri',          icon: '🚉' },
];

const CATEGORIES = [
  { label: 'Wildlife',  slug: 'wildlife-sanctuaries', icon: '🐯', sub: 'Sanctuaries & Parks',  color: 'bg-green-50',  text: 'text-green-600',  count: '4 types'      },
  { label: 'Heritage',  slug: 'monuments',            icon: '🏛️', sub: 'Forts & Monuments',    color: 'bg-amber-50',  text: 'text-amber-600',  count: '7 types'      },
  { label: 'Spiritual', slug: 'hinduism',             icon: '🪔', sub: 'Temples & Pilgrimages', color: 'bg-purple-50', text: 'text-purple-600', count: '7 faiths'     },
  { label: 'Adventure', slug: 'hiking-trekking',      icon: '🥾', sub: 'Trekking & Rafting',    color: 'bg-orange-50', text: 'text-orange-500', count: '9 activities' },
  { label: 'Rural',     slug: 'eco-tourism',          icon: '🌾', sub: 'Agro & Eco Tourism',    color: 'bg-emerald-50',text: 'text-emerald-600',count: '5 types'      },
  { label: 'Nature',    slug: 'hills-mountains',      icon: '🏔️', sub: 'Hills, Beaches & Lakes',color: 'bg-sky-50',   text: 'text-sky-600',    count: '5 types'      },
];

// Sample cards link to the /homestays search page (no fake slugs)
const FEATURED = [
  { name: 'Himalayan Mist Cottage',  district: 'Darjeeling',        price: 1800, rating: 4.9, tags: ['Free Wi-Fi','Free breakfast','Mountain View'], category: 'Nature',   slug: null,  premium: true,  img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=75' },
  { name: 'Sundarbans Forest Lodge', district: 'South 24 Parganas', price: 2500, rating: 4.7, tags: ['Boat Safari','Restaurant','Beach access'],     category: 'Wildlife', slug: null,  premium: false, img: 'https://images.unsplash.com/photo-1586375300773-8384e3e4916f?w=600&q=75' },
  { name: "Nawab's Heritage Haveli", district: 'Murshidabad',       price: 3200, rating: 4.8, tags: ['Air-conditioned','Parking','Spa'],              category: 'Heritage', slug: null,  premium: true,  img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=75' },
];

const POPULAR_TAGS = ['Darjeeling','Sundarbans','Kalimpong','Digha','Murshidabad','Purulia'];

export default function HomePage() {
  const router = useRouter();
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

      {/* ── HERO ── */}
      <section
        className="min-h-screen flex flex-col justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg,rgba(14,63,44,.85) 0%,rgba(21,98,67,.70) 50%,rgba(212,146,26,.50) 100%),
            url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&q=80') center/cover no-repeat`,
        }}
      >
        <div className="absolute top-28 right-8 md:right-16 hidden md:block">
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 text-white text-center shadow-lg">
            <div className="text-2xl font-bold">500+</div>
            <div className="text-xs opacity-80">Verified Homestays</div>
          </div>
        </div>
        <div className="absolute bottom-32 right-12 hidden md:block">
          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 text-white text-center shadow-lg">
            <div className="text-2xl font-bold">22</div>
            <div className="text-xs opacity-80">Districts Covered</div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-16 w-full">
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

          <div className="rounded-3xl p-5 md:p-6 max-w-4xl backdrop-blur-md bg-white/10 border border-white/25">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white/90 rounded-2xl px-4 py-3">
                <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-1">📍 District</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full bg-transparent text-gray-800 text-sm font-medium focus:outline-none">
                  <option value="">All Districts</option>
                  {DISTRICTS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="bg-white/90 rounded-2xl px-4 py-3">
                <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-1">🏷️ Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-transparent text-gray-800 text-sm font-medium focus:outline-none">
                  <option value="">All Types</option>
                  {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </div>
              <button onClick={doSearch} className="bg-green-700 hover:bg-green-600 text-white rounded-2xl px-6 py-3 font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                🔍 Search Stays
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <span className="text-white/70 text-xs">Popular:</span>
              {POPULAR_TAGS.map((p) => (
                <button key={p} onClick={() => router.push(`/homestays?district=${encodeURIComponent(p)}`)}
                  className="bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 transition-all">
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-8 text-white/80 text-sm">
            <span>✅ Admin-verified listings</span>
            <span>🛡️ Secure contact</span>
            <span>⭐ Reviewed by real guests</span>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-green-700 text-sm font-semibold uppercase tracking-widest">Explore by Interest</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">What Kind of Journey?</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Every corner of West Bengal tells a different story. Choose yours.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/homestays?category=${c.slug}`}
                className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md border border-gray-100 hover:-translate-y-1 transition-all block">
                <div className={`w-14 h-14 rounded-2xl ${c.color} flex items-center justify-center mx-auto mb-3 text-2xl`}>{c.icon}</div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{c.label}</h3>
                <p className="text-xs text-gray-500">{c.sub}</p>
                <span className={`text-xs font-medium mt-2 block ${c.text}`}>{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED HOMESTAYS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-green-700 text-sm font-semibold uppercase tracking-widest">Hand-Picked for You</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Featured Homestays</h2>
            </div>
            <Link href="/homestays" className="hidden md:flex items-center gap-2 text-green-700 hover:text-green-900 font-semibold text-sm">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED.map((h, i) => (
              <div key={h.name} className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="relative h-56 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.img} alt={h.name} className="w-full h-full object-cover" loading="lazy" />
                  {h.premium && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">👑 Premium</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-green-900/70 text-white text-xs px-2.5 py-1 rounded-full font-medium">{h.category}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-gray-900 text-base leading-tight">{h.name}</h3>
                    <span className="text-xs font-bold ml-2 flex-shrink-0">⭐ {h.rating}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">📍 {h.district}, West Bengal</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {h.tags.map((t) => <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">{t}</span>)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div><span className="text-green-700 font-bold text-lg">₹{h.price.toLocaleString('en-IN')}</span><span className="text-gray-400 text-xs"> / night</span></div>
                    <Link href={`/homestays?district=${encodeURIComponent(h.district)}`} className="bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/homestays" className="inline-flex items-center gap-2 border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white px-8 py-3 rounded-full font-bold transition-all">
              Explore All Homestays →
            </Link>
          </div>
        </div>
      </section>

      {/* ── DISTRICTS (dark) ── */}
      <section className="py-20 bg-green-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-yellow-300 text-sm font-semibold uppercase tracking-widest">All 22 Districts</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Explore West Bengal</h2>
            <p className="text-white/60 mt-3 max-w-xl mx-auto">Find homestays across every corner of the state.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {DISTRICTS.map((d) => (
              <Link key={d.name} href={`/homestays?district=${encodeURIComponent(d.name)}`}
                className="bg-white/10 hover:bg-green-700 text-white border border-white/20 rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-1.5">
                <span className="text-xs">{d.icon}</span>{d.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <span className="text-green-700 text-sm font-semibold uppercase tracking-widest">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '1', icon: '🔍', color: 'bg-green-50',  title: 'Search & Discover',  desc: 'Browse homestays by district, category, price range, or proximity to your destination.' },
              { n: '2', icon: '💬', color: 'bg-yellow-50', title: 'Connect with Host',   desc: 'Send an inquiry directly to the verified host. Get responses about availability and pricing.' },
              { n: '3', icon: '🏡', color: 'bg-orange-50', title: 'Stay & Experience',   desc: 'Arrive, enjoy authentic Bengali hospitality, and leave a review to help other travellers.' },
            ].map((s) => (
              <div key={s.n} className="text-center relative">
                <div className={`w-20 h-20 rounded-3xl ${s.color} flex items-center justify-center mx-auto mb-5 text-4xl border-2 border-white shadow-sm`}>
                  {s.icon}
                </div>
                <div className="absolute top-0 right-1/4 w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {s.n}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOST CTA ── */}
      <section className="py-20 bg-gradient-to-br from-green-800 to-green-900">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-yellow-300 text-sm font-semibold uppercase tracking-widest">For Homestay Owners</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">List Your Property for Free</h2>
              <p className="text-white/75 text-base leading-relaxed mb-6">
                Reach thousands of travellers looking for authentic Bengal experiences. Start with our free listing — upgrade to Premium for booking tracking, analytics, and priority placement.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'Free listing with photos and amenities',
                  'Premium dashboard with booking & payment tracking',
                  'Priority placement in search results',
                  'Verified host badge builds guest trust',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-3 text-white/85 text-sm">
                    <span className="text-yellow-300 text-base flex-shrink-0">✅</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/host/register" className="bg-yellow-500 hover:bg-yellow-400 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg inline-block">
                List for Free →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '500+', label: 'Listed Properties', gold: false },
                { val: '22',   label: 'Districts Covered',  gold: true  },
                { val: '4.8★', label: 'Average Rating',     gold: false },
                { val: 'Free', label: 'To Get Started',     gold: true  },
              ].map((s) => (
                <div key={s.label} className={`${s.gold ? 'bg-yellow-500/30 border-yellow-400/40' : 'bg-white/10 border-white/20'} border rounded-2xl p-5 text-center`}>
                  <div className={`text-3xl font-bold ${s.gold ? 'text-yellow-200' : 'text-white'}`}>{s.val}</div>
                  <div className="text-white/60 text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl font-bold mb-3">Bengal Homestay</h3>
              <p className="text-gray-400 text-sm leading-relaxed">West Bengal&apos;s most trusted homestay directory. Connecting travellers with authentic local experiences since 2024.</p>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest text-gray-300 mb-4">Explore</h4>
              <ul className="space-y-2.5">
                {[['All Homestays','/homestays'],['Wildlife Stays','/homestays?category=wildlife-sanctuaries'],['Heritage Stays','/homestays?category=monuments'],['Adventure','/homestays?category=hiking-trekking'],['Nature Stays','/homestays?category=hills-mountains']].map(([l,h]) => (
                  <li key={l}><Link href={h} className="text-gray-400 hover:text-white text-sm transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest text-gray-300 mb-4">For Hosts</h4>
              <ul className="space-y-2.5">
                {[['List Your Property','/host/register'],['Host Dashboard','/host/dashboard'],['Admin Panel','/admin/dashboard']].map(([l,h]) => (
                  <li key={l}><Link href={h} className="text-gray-400 hover:text-white text-sm transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest text-gray-300 mb-4">Account</h4>
              <ul className="space-y-2.5">
                {[['Sign In','/login'],['Register as Host','/host/register'],['Browse Stays','/homestays']].map(([l,h]) => (
                  <li key={l}><Link href={h} className="text-gray-400 hover:text-white text-sm transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            © 2024 BengalHomestay.com · Made with ❤️ in West Bengal
          </div>
        </div>
      </footer>

    </div>
  );
}
