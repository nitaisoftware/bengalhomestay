'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const DISTRICTS = [
  'Darjeeling','Kalimpong','Jalpaiguri','Cooch Behar','Alipurduar',
  'Siliguri','Malda','Murshidabad','Birbhum','Bardhaman',
  'Nadia','North 24 Parganas','South 24 Parganas','Kolkata',
  'Hooghly','Howrah','Bankura','Purulia','West Midnapore',
  'East Midnapore','Jhargram','Sundarbans',
];

const CATEGORIES = [
  { slug: 'wildlife-sanctuaries',    label: 'Wildlife Sanctuaries',    group: 'wildlife'   },
  { slug: 'bird-watching',           label: 'Bird Watching',           group: 'wildlife'   },
  { slug: 'national-parks',          label: 'National Parks',          group: 'wildlife'   },
  { slug: 'monuments',               label: 'Monuments',               group: 'heritage'   },
  { slug: 'palaces-forts',           label: 'Palaces & Forts',         group: 'heritage'   },
  { slug: 'hinduism',                label: 'Hinduism',                group: 'spiritual'  },
  { slug: 'rafting',                 label: 'Rafting',                 group: 'adventure'  },
  { slug: 'hiking-trekking',         label: 'Hiking & Trekking',       group: 'adventure'  },
  { slug: 'agro-tourism',            label: 'Agro Tourism',            group: 'rural'      },
  { slug: 'eco-tourism',             label: 'Eco Tourism',             group: 'rural'      },
  { slug: 'hills-mountains',         label: 'Hills & Mountains',       group: 'nature'     },
  { slug: 'rivers-lakes',            label: 'Rivers & Lakes',          group: 'nature'     },
  { slug: 'beaches-cruises',         label: 'Beaches & Cruises',       group: 'nature'     },
  { slug: 'sustainable-tourism',     label: 'Sustainable Tourism',     group: 'nature'     },
];

const AMENITIES = [
  'Free parking','Parking','Indoor pool','Outdoor pool','Pool',
  'Fitness center','Restaurant','Free breakfast','Spa','Beach access',
  'Child-friendly','Bar','Pet-friendly','Room service','Free Wi-Fi',
  'Air-conditioned','All-inclusive available','Wheelchair accessible','EV charger',
];

export default function SearchFilters() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const toggleAmenity = (amenity: string) => {
    const current = searchParams.get('amenities')?.split(',').filter(Boolean) ?? [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    updateParam('amenities', next.join(','));
  };

  const selectedAmenities = searchParams.get('amenities')?.split(',').filter(Boolean) ?? [];

  return (
    <aside className="w-full space-y-6">

      {/* District */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">District</h3>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600"
          value={searchParams.get('district') ?? ''}
          onChange={(e) => updateParam('district', e.target.value)}
        >
          <option value="">All Districts</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Category</h3>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600"
          value={searchParams.get('category') ?? ''}
          onChange={(e) => updateParam('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Price per night</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            value={searchParams.get('minPrice') ?? ''}
            onChange={(e) => updateParam('minPrice', e.target.value)}
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            placeholder="Max ₹"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            value={searchParams.get('maxPrice') ?? ''}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
          />
        </div>
      </div>

      {/* Stay duration */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Stay duration</h3>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600"
          value={searchParams.get('maxStay') ?? ''}
          onChange={(e) => updateParam('maxStay', e.target.value)}
        >
          <option value="">Any length</option>
          <option value="2">1–2 Days</option>
          <option value="4">3–4 Days</option>
          <option value="6">5–6 Days</option>
          <option value="10">7–10 Days</option>
        </select>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const active = selectedAmenities.includes(a);
            return (
              <button
                key={a}
                onClick={() => toggleAmenity(a)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-green-700 text-white border-green-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-600'
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear filters */}
      <button
        onClick={() => router.push(pathname)}
        className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors underline"
      >
        Clear all filters
      </button>

    </aside>
  );
}
