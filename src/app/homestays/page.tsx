'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

const DISTRICTS = [
  'Darjeeling','Kalimpong','Jalpaiguri','Alipurduar','Cooch Behar',
  'Malda','Murshidabad','Birbhum','Bankura','Purulia','Jhargram',
  'West Midnapore','East Midnapore','South 24 Parganas',
  'North 24 Parganas','Nadia','Hooghly','Howrah','Kolkata',
  'Bardhaman','Sundarbans','Siliguri',
];

const CATEGORIES = [
  { label: 'Wildlife',  slug: 'wildlife-sanctuaries' },
  { label: 'Heritage',  slug: 'monuments'            },
  { label: 'Spiritual', slug: 'hinduism'             },
  { label: 'Adventure', slug: 'hiking-trekking'      },
  { label: 'Rural',     slug: 'eco-tourism'          },
  { label: 'Nature',    slug: 'hills-mountains'      },
];

const AMENITIES = [
  'Free parking','Parking','Indoor pool','Outdoor pool','Pool',
  'Fitness center','Restaurant','Free breakfast','Spa','Beach access',
  'Child-friendly','Bar','Pet-friendly','Room service','Free Wi-Fi',
  'Air-conditioned','All-inclusive available','Wheelchair accessible','EV charger',
];

interface Homestay {
  id: string;
  slug: string;
  name: string;
  district: string;
  pricePerNight: number;
  avgRating: number | null;
  isFeatured: boolean;
  isPremium: boolean;
  amenities: string[];
  images: { url: string; isCover: boolean }[];
  categories: { category: { name: string; slug: string } }[];
}

interface ApiResponse {
  homestays: Homestay[];
  total: number;
  page: number;
  pages: number;
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">✕</button>
    </span>
  );
}

function HomestayCard({ h }: { h: Homestay }) {
  const cover = h.images.find(i => i.isCover) ?? h.images[0];
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt={h.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🏡</div>
        )}
        {h.isPremium && (
          <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">👑 Premium</span>
        )}
        {!h.isPremium && h.isFeatured && (
          <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">⭐ Featured</span>
        )}
        {h.categories[0] && (
          <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
            {h.categories[0].category.name}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{h.name}</h3>
          {h.avgRating && (
            <span className="text-xs font-bold text-gray-700 flex-shrink-0">⭐ {h.avgRating}</span>
          )}
        </div>
        <p className="text-gray-500 text-xs mb-3">📍 {h.district}, West Bengal</p>
        {h.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {h.amenities.slice(0, 3).map(a => (
              <span key={a} className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">{a}</span>
            ))}
            {h.amenities.length > 3 && (
              <span className="text-gray-400 text-xs">+{h.amenities.length - 3}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-green-700 font-bold">₹{h.pricePerNight.toLocaleString('en-IN')}</span>
            <span className="text-gray-400 text-xs"> / night</span>
          </div>
          <Link href={`/homestays/${h.slug}`}
            className="bg-green-700 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomestaysContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [district,    setDistrict]    = useState(searchParams.get('district')  ?? '');
  const [category,    setCategory]    = useState(searchParams.get('category')  ?? '');
  const [minPrice,    setMinPrice]    = useState(searchParams.get('minPrice')  ?? '');
  const [maxPrice,    setMaxPrice]    = useState(searchParams.get('maxPrice')  ?? '');
  const [amenity,     setAmenity]     = useState(searchParams.get('amenity')   ?? '');
  const [sort,        setSort]        = useState(searchParams.get('sort')      ?? 'featured');
  const [page,        setPage]        = useState(Number(searchParams.get('page') ?? 1));
  const [showFilters, setShowFilters] = useState(false);
  const [data,        setData]        = useState<ApiResponse | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (district) params.set('district', district);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (amenity)  params.set('amenity',  amenity);
    if (sort)     params.set('sort',     sort);
    params.set('page',  String(page));
    params.set('limit', '12');

    setLoading(true);
    fetch(`/api/homestays?${params.toString()}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));

    router.replace(`/homestays?${params.toString()}`, { scroll: false });
  }, [district, category, minPrice, maxPrice, amenity, sort, page, router]);

  function clearFilters() {
    setDistrict(''); setCategory(''); setMinPrice('');
    setMaxPrice(''); setAmenity(''); setSort('featured'); setPage(1);
  }

  const hasFilters = district || category || minPrice || maxPrice || amenity;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-green-900 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>›</span>
            <span className="text-white">Homestays</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">
            {district ? `Homestays in ${district}` : 'All Homestays'}
          </h1>
          <p className="text-white/70 text-sm">
            {data
              ? `${data.total} verified homestay${data.total !== 1 ? 's' : ''} across West Bengal`
              : 'Searching...'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar – desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Filters</h2>
                {hasFilters && <button onClick={clearFilters} className="text-xs text-green-700 hover:underline">Clear all</button>}
              </div>

              <FilterSelect label="District" value={district} onChange={v => { setDistrict(v); setPage(1); }}>
                <option value="">All Districts</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </FilterSelect>

              <FilterSelect label="Category" value={category} onChange={v => { setCategory(v); setPage(1); }}>
                <option value="">All Types</option>
                {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </FilterSelect>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Price / Night (₹)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={minPrice}
                    onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <input type="number" placeholder="Max" value={maxPrice}
                    onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              <FilterSelect label="Amenity" value={amenity} onChange={v => { setAmenity(v); setPage(1); }}>
                <option value="">Any</option>
                {AMENITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </FilterSelect>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <button onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium">
                🎛️ Filters
                {hasFilters && <span className="bg-green-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">✓</span>}
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500 hidden sm:block">Sort:</span>
                <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="featured">Featured First</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Mobile filter panel */}
            {showFilters && (
              <div className="lg:hidden bg-white border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <FilterSelect label="District" value={district} onChange={v => { setDistrict(v); setPage(1); }}>
                    <option value="">All</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </FilterSelect>
                  <FilterSelect label="Category" value={category} onChange={v => { setCategory(v); setPage(1); }}>
                    <option value="">All</option>
                    {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </FilterSelect>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Min ₹</label>
                    <input type="number" placeholder="0" value={minPrice}
                      onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Max ₹</label>
                    <input type="number" placeholder="Any" value={maxPrice}
                      onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                </div>
                {hasFilters && <button onClick={clearFilters} className="text-sm text-green-700 hover:underline mt-3 block">Clear all</button>}
              </div>
            )}

            {/* Active chips */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {district && <Chip label={district} onRemove={() => setDistrict('')} />}
                {category && <Chip label={CATEGORIES.find(c => c.slug === category)?.label ?? category} onRemove={() => setCategory('')} />}
                {minPrice && <Chip label={`Min ₹${minPrice}`} onRemove={() => setMinPrice('')} />}
                {maxPrice && <Chip label={`Max ₹${maxPrice}`} onRemove={() => setMaxPrice('')} />}
                {amenity  && <Chip label={amenity} onRemove={() => setAmenity('')} />}
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data || data.homestays.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏡</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No homestays found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters.</p>
                <button onClick={clearFilters} className="bg-green-700 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-green-600 transition-all">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {data.homestays.map(h => <HomestayCard key={h.id} h={h} />)}
                </div>

                {data.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-all">
                      ← Prev
                    </button>
                    {Array.from({ length: data.pages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === data.pages || Math.abs(p - page) <= 1)
                      .reduce<(number | string)[]>((acc, p, i, arr) => {
                        if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) => p === '...' ? (
                        <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                      ) : (
                        <button key={p} onClick={() => setPage(p as number)}
                          className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === p ? 'bg-green-700 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>
                          {p}
                        </button>
                      ))
                    }
                    <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-all">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
        {children}
      </select>
    </div>
  );
}

export default function HomestaysPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
    }>
      <HomestaysContent />
    </Suspense>
  );
}
