'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader, { type UploadedImage } from '@/components/homestay/ImageUploader';

const DISTRICTS = [
  'Darjeeling','Kalimpong','Jalpaiguri','Cooch Behar','Alipurduar',
  'Siliguri','Malda','Murshidabad','Birbhum','Bardhaman',
  'Nadia','North 24 Parganas','South 24 Parganas','Kolkata',
  'Hooghly','Howrah','Bankura','Purulia','West Midnapore',
  'East Midnapore','Jhargram','Sundarbans',
];

const AMENITIES = [
  'Free parking','Parking','Indoor pool','Outdoor pool','Pool',
  'Fitness center','Restaurant','Free breakfast','Spa','Beach access',
  'Child-friendly','Bar','Pet-friendly','Room service','Free Wi-Fi',
  'Air-conditioned','All-inclusive available','Wheelchair accessible','EV charger',
];

const ROOM_FACILITIES = [
  'Free parking','Parking','Indoor pool','Outdoor pool','Pool',
  'Fitness center','Restaurant','Free breakfast','Spa','Beach access',
  'Child-friendly','Bar','Pet-friendly','Room service','Free Wi-Fi',
  'Air-conditioned','All-inclusive available','Wheelchair accessible','EV charger',
];

const BED_TYPES = ['Single','Double','Twin','Triple','Queen','King','Dormitory'];

const CATEGORY_GROUPS = [
  { group: 'Wildlife',  icon: '🦁', subs: [
    { slug: 'wildlife-sanctuaries',         label: 'Wildlife Sanctuaries'         },
    { slug: 'zoological-parks',             label: 'Zoological Parks'             },
    { slug: 'bird-watching',                label: 'Bird Watching'                },
    { slug: 'national-parks',               label: 'National Parks'               },
  ]},
  { group: 'Heritage',  icon: '🏛️', subs: [
    { slug: 'heritage-monuments',           label: 'Heritage Monuments'           },
    { slug: 'museums',                      label: 'Museums'                      },
    { slug: 'historical-buildings',         label: 'Historical Buildings'         },
    { slug: 'unesco-world-heritage-sites',  label: 'UNESCO World Heritage Sites'  },
    { slug: 'archeological-sites',          label: 'Archeological Sites'          },
    { slug: 'historical-sites',             label: 'Historical Sites'             },
    { slug: 'palaces-forts',                label: 'Palaces & Forts'              },
  ]},
  { group: 'Spiritual', icon: '🙏', subs: [
    { slug: 'hinduism',    label: 'Hinduism'    },
    { slug: 'islam',       label: 'Islam'       },
    { slug: 'buddhism',    label: 'Buddhism'    },
    { slug: 'sikhism',     label: 'Sikhism'     },
    { slug: 'jainism',     label: 'Jainism'     },
    { slug: 'christianity',label: 'Christianity'},
    { slug: 'jewish',      label: 'Jewish'      },
  ]},
  { group: 'Adventure', icon: '🏔️', subs: [
    { slug: 'rafting',                        label: 'Rafting'                          },
    { slug: 'paragliding',                    label: 'Paragliding'                      },
    { slug: 'parasailing',                    label: 'Parasailing'                      },
    { slug: 'skiing',                         label: 'Skiing'                           },
    { slug: 'sky-diving',                     label: 'Sky Diving'                       },
    { slug: 'bungee-jumping',                 label: 'Bungee Jumping'                   },
    { slug: 'mountain-biking',                label: 'Mountain Biking'                  },
    { slug: 'hiking-trekking',                label: 'Hiking & Trekking'                },
    { slug: 'mountaineering-rock-climbing',   label: 'Mountaineering & Rock Climbing'   },
  ]},
  { group: 'Rural',     icon: '🌾', subs: [
    { slug: 'agro-tourism',    label: 'Agro-Tourism'    },
    { slug: 'crafts-tourism',  label: 'Crafts-Tourism'  },
    { slug: 'tribal-tourism',  label: 'Tribal-Tourism'  },
    { slug: 'eco-tourism',     label: 'Eco-Tourism'     },
    { slug: 'wildlife-tourism',label: 'Wildlife-Tourism'},
  ]},
  { group: 'Nature',    icon: '🌿', subs: [
    { slug: 'sustainable-tourism', label: 'Sustainable Tourism' },
    { slug: 'beaches-cruises',     label: 'Beaches & Cruises'   },
    { slug: 'hills-mountains',     label: 'Hills & Mountains'   },
    { slug: 'forests-gardens',     label: 'Forests & Gardens'   },
    { slug: 'rivers-lakes',        label: 'Rivers & Lakes'      },
  ]},
];

interface Room {
  name:          string;
  capacity:      string;
  bedType:       string;
  pricePerNight: string;
  amenities:     string[];
}

const EMPTY_ROOM: Room = { name: '', capacity: '2', bedType: 'Double', pricePerNight: '', amenities: [] };

export default function NewListingPage() {
  const router = useRouter();

  // ── Onboarding gate ───────────────────────────────────────────────────────
  useEffect(() => {
    const token    = sessionStorage.getItem('access_token');
    const userJson = sessionStorage.getItem('user');

    if (!token) { router.replace('/host/login'); return; }

    const user = userJson ? JSON.parse(userJson) : null;

    // Already a host or admin — let them through unconditionally
    if (user?.role === 'host' || user?.role === 'admin') return;

    // Guest who hasn't completed host onboarding
    if (!user?.onboardingComplete) {
      router.replace('/host/register?incomplete=1');
      return;
    }
  }, [router]);

  const [form, setForm] = useState({
    name: '', description: '', district: '', address: '',
    pincode: '', pricePerNight: '', minStayDays: '1', maxStayDays: '30',
  });
  const [amenities,      setAmenities]      = useState<string[]>([]);
  const [categorySlugs,  setCategorySlugs]  = useState<string[]>([]);
  const [rooms,          setRooms]          = useState<Room[]>([{ ...EMPTY_ROOM }]);
  const [images,         setImages]         = useState<UploadedImage[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // ── Room helpers ──────────────────────────────────────────────────────────
  function addRoom() {
    setRooms((r) => [...r, { ...EMPTY_ROOM }]);
  }

  function removeRoom(i: number) {
    setRooms((r) => r.filter((_, idx) => idx !== i));
  }

  function updateRoom(i: number, field: keyof Room, value: string) {
    setRooms((r) => r.map((room, idx) => idx === i ? { ...room, [field]: value } : room));
  }

  function toggleRoomAmenity(i: number, a: string) {
    setRooms((r) => r.map((room, idx) => {
      if (idx !== i) return room;
      const has = room.amenities.includes(a);
      return { ...room, amenities: has ? room.amenities.filter((x) => x !== a) : [...room.amenities, a] };
    }));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const token = sessionStorage.getItem('access_token');
    if (!token) { router.push('/host/register'); return; }

    if (!form.name || !form.district || !form.pricePerNight) {
      setError('Please fill in name, district and base price');
      return;
    }

    setLoading(true);
    try {
      const catRes  = await fetch(`/api/categories?slugs=${categorySlugs.join(',')}`);
      const catData = catRes.ok ? await catRes.json() : { ids: [] };

      const res = await fetch('/api/owner/listings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          amenities,
          categoryIds: catData.ids ?? [],
          rooms:  rooms.filter((r) => r.name.trim()),
          images: images.map((img) => ({ url: img.url, publicId: img.publicId, isCover: img.isCover })),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to create listing'); return; }
      router.push('/host/dashboard?created=1');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4">
        <Link href="/host/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← Dashboard</Link>
        <span className="text-gray-200">|</span>
        <span className="text-sm font-medium text-gray-700">Add New Listing</span>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Your Homestay</h1>
        <p className="text-sm text-gray-500 mb-8">Your listing will be reviewed by admin before going live.</p>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Basic Info */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Homestay name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. Himalayan Retreat, Sundarbans Village Home"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                placeholder="Describe your homestay — what makes it special, nearby attractions..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                <select name="district" value={form.district} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" required>
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input name="pincode" value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="700001" maxLength={6} inputMode="numeric" pattern="\d{6}"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full address</label>
              <input name="address" value={form.address} onChange={handleChange}
                placeholder="Village, Post Office, Block..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
          </section>

          {/* Photos */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Photos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Upload up to 10 photos. The first one will be the cover image.</p>
            </div>
            <ImageUploader images={images} onChange={setImages} maxImages={10} />
          </section>

          {/* Pricing */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Base Pricing & Stay Duration</h2>
              <p className="text-xs text-gray-400 mt-0.5">This is the starting price. Each room can have its own rate below.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base price per night (₹) *</label>
              <input name="pricePerNight" value={form.pricePerNight} onChange={handleChange}
                type="number" min="0" placeholder="1500"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum stay</label>
                <select name="minStayDays" value={form.minStayDays} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                  {[1,2,3,4,5,7].map((n) => <option key={n} value={n}>{n} night{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum stay</label>
                <select name="maxStayDays" value={form.maxStayDays} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                  {[7,10,14,21,30].map((n) => <option key={n} value={n}>{n} nights</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Rooms */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Rooms</h2>
                <p className="text-xs text-gray-400 mt-0.5">{rooms.length} room{rooms.length !== 1 ? 's' : ''} added — each with its own rate and amenities</p>
              </div>
              <button type="button" onClick={addRoom}
                className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium">
                + Add room
              </button>
            </div>

            <div className="space-y-4">
              {rooms.map((room, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Room {i + 1}</span>
                    {rooms.length > 1 && (
                      <button type="button" onClick={() => removeRoom(i)}
                        className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Room name *</label>
                      <input value={room.name} onChange={(e) => updateRoom(i, 'name', e.target.value)}
                        placeholder="Deluxe Double, Mountain View Suite..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Bed type</label>
                      <select value={room.bedType} onChange={(e) => updateRoom(i, 'bedType', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600">
                        {BED_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Guests capacity</label>
                      <select value={room.capacity} onChange={(e) => updateRoom(i, 'capacity', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600">
                        {[1,2,3,4,5,6,8,10].map((n) => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Price per night (₹)</label>
                      <input type="number" min="0" value={room.pricePerNight}
                        onChange={(e) => updateRoom(i, 'pricePerNight', e.target.value)}
                        placeholder={form.pricePerNight || '1500'}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Room Facilities</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ROOM_FACILITIES.map((a) => {
                        const active = room.amenities.includes(a);
                        return (
                          <button key={a} type="button" onClick={() => toggleRoomAmenity(i, a)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              active ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-500 border-gray-200 hover:border-green-500'
                            }`}>
                            {a}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addRoom}
              className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 py-3 rounded-xl text-sm transition-colors">
              + Add another room
            </button>
          </section>

          {/* Common Amenities */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Common Property Amenities</h2>
            <p className="text-xs text-gray-400 mb-4">Available to all guests (parking, garden, etc.)</p>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const active = amenities.includes(a);
                return (
                  <button key={a} type="button" onClick={() => setAmenities((prev) =>
                    prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      active ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-green-600'
                    }`}>
                    {a}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Categories */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-gray-900">Categories</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                categorySlugs.length >= 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {categorySlugs.length} / 3 selected
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-5">Select maximum 3 sub-categories from any group</p>
            <div className="space-y-5">
              {CATEGORY_GROUPS.map((g) => (
                <div key={g.group}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {g.icon} {g.group}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.subs.map((s) => {
                      const active   = categorySlugs.includes(s.slug);
                      const maxed    = !active && categorySlugs.length >= 3;
                      return (
                        <button key={s.slug} type="button"
                          disabled={maxed}
                          onClick={() => setCategorySlugs((prev) =>
                            prev.includes(s.slug)
                              ? prev.filter((x) => x !== s.slug)
                              : prev.length < 3 ? [...prev, s.slug] : prev
                          )}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            active  ? 'bg-green-700 text-white border-green-700'
                            : maxed ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-green-600'
                          }`}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3 pb-8">
            <Link href="/host/dashboard"
              className="flex-1 text-center border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
