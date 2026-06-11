import { notFound }     from 'next/navigation';
import type { Metadata } from 'next';
import Image              from 'next/image';
import Link               from 'next/link';
import ContactButton      from '@/components/homestay/ContactButton';

interface Room {
  id:            string;
  name:          string;
  capacity:      number;
  bedType:       string | null;
  pricePerNight: number;
  amenities:     string[];
}

interface Review {
  id:        string;
  rating:    number;
  comment:   string | null;
  createdAt: string;
  user:      { name: string | null; avatarUrl: string | null };
}

interface Homestay {
  id:            string;
  slug:          string;
  name:          string;
  description:   string | null;
  district:      string;
  address:       string | null;
  state:         string;
  pincode:       string | null;
  lat:           number | null;
  lng:           number | null;
  pricePerNight: number;
  minStayDays:   number;
  maxStayDays:   number;
  amenities:     string[];
  isFeatured:    boolean;
  isPremium:     boolean;
  avgRating:     number | null;
  createdAt:     string;
  owner:         { id: string; name: string | null; avatarUrl: string | null; createdAt: string };
  images:        { id: string; url: string; altText: string | null; isCover: boolean }[];
  rooms:         Room[];
  categories:    { category: { name: string; slug: string; group: string; icon: string | null } }[];
  reviews:       Review[];
  _count:        { reviews: number; bookings: number };
}

async function getHomestay(slug: string): Promise<Homestay | null> {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const res  = await fetch(`${base}/api/homestays/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const h = await getHomestay(slug);
  if (!h) return { title: 'Homestay not found' };
  return {
    title:       `${h.name} — ${h.district} | BengalHomestay`,
    description: h.description?.slice(0, 160) ?? `Homestay in ${h.district}, West Bengal`,
    openGraph: {
      images: h.images[0] ? [{ url: h.images[0].url }] : [],
    },
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

const AMENITY_ICONS: Record<string, string> = {
  'Wi-Fi':         '📶',
  'Parking':       '🅿️',
  'Geyser':        '🚿',
  'AC':            '❄️',
  'Kitchen':       '🍳',
  'Laundry':       '👕',
  'Pet-friendly':  '🐾',
  'Garden':        '🌿',
  'River View':    '🌊',
  'Mountain View': '⛰️',
  'TV':            '📺',
};

export default async function HomestayDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const h = await getHomestay(slug);
  if (!h) notFound();

  const lowestRoomPrice = h.rooms.length > 0
    ? Math.min(...h.rooms.map((r) => r.pricePerNight))
    : h.pricePerNight;

  const coverImage  = h.images.find((i) => i.isCover) ?? h.images[0] ?? null;
  const otherImages = h.images.filter((i) => i.id !== coverImage?.id).slice(0, 4);
  const hostSince   = new Date(h.owner.createdAt).getFullYear();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/homestays" className="hover:text-green-700">Homestays</Link>
        <span>›</span>
        <Link href={`/homestays?district=${encodeURIComponent(h.district)}`} className="hover:text-green-700">
          {h.district}
        </Link>
        <span>›</span>
        <span className="text-gray-600 line-clamp-1">{h.name}</span>
      </nav>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {h.isPremium && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">Premium</span>
            )}
            {h.isFeatured && !h.isPremium && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Featured</span>
            )}
            {h.categories.map((c) => (
              <span key={c.category.slug} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {c.category.name}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{h.name}</h1>
          <p className="text-gray-500 mt-1">
            📍 {h.district}{h.address ? `, ${h.address}` : ''}
            {h.pincode ? ` – ${h.pincode}` : ''}
          </p>
          {h.avgRating && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={h.avgRating} />
              <span className="text-sm font-medium text-gray-700">{h.avgRating}</span>
              <span className="text-sm text-gray-400">({h._count.reviews} review{h._count.reviews !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-green-700">₹{lowestRoomPrice.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400">{h.rooms.length > 1 ? 'from / night' : '/ night'}</p>
          {h.minStayDays > 1 && (
            <p className="text-xs text-gray-400 mt-0.5">min {h.minStayDays} nights</p>
          )}
        </div>
      </div>

      {/* Image gallery */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden mb-8 h-80 sm:h-96">
        <div className="col-span-4 sm:col-span-2 row-span-2 relative bg-gray-100">
          {coverImage ? (
            <Image src={coverImage.url} alt={coverImage.altText ?? h.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-6xl">🏡</div>
          )}
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="hidden sm:block relative bg-gray-100">
            {otherImages[i] ? (
              <Image src={otherImages[i].url} alt={otherImages[i].altText ?? h.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">

          {h.description && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About this homestay</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{h.description}</p>
            </section>
          )}

          {h.amenities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {h.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                    <span>{AMENITY_ICONS[a] ?? '✓'}</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {h.rooms.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Rooms <span className="text-sm text-gray-400 font-normal">({h.rooms.length} available)</span>
              </h2>
              <div className="space-y-3">
                {h.rooms.map((r) => (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{r.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {r.bedType && <span>{r.bedType} bed · </span>}
                        {r.capacity} guest{r.capacity !== 1 ? 's' : ''}
                      </p>
                      {r.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {r.amenities.map((a) => (
                            <span key={a} className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-green-700">₹{r.pricePerNight.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">/ night</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
            {h.lat && h.lng ? (
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <iframe
                  title="Map"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${h.lat},${h.lng}&z=14&output=embed`}
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
                <p className="text-2xl mb-2">📍</p>
                <p>{h.district}, West Bengal</p>
                {h.address && <p className="mt-1 text-gray-500">{h.address}</p>}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Reviews
              {h.avgRating && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {h.avgRating} ★ · {h._count.reviews} review{h._count.reviews !== 1 ? 's' : ''}
                </span>
              )}
            </h2>
            {h.reviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet. Be the first to stay here!</p>
            ) : (
              <div className="space-y-4">
                {h.reviews.map((r) => (
                  <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold">
                        {(r.user.name ?? 'G')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.user.name ?? 'Guest'}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <StarRating rating={r.rating} />
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right column — sticky booking card */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">

            <div>
              <p className="text-2xl font-bold text-green-700">
                ₹{lowestRoomPrice.toLocaleString('en-IN')}
                {h.rooms.length > 1 && <span className="text-sm font-normal text-gray-400"> / room</span>}
                <span className="text-sm font-normal text-gray-400"> / night</span>
              </p>
              {h.avgRating && (
                <p className="text-sm text-gray-500 mt-0.5">
                  ★ {h.avgRating} · {h._count.reviews} review{h._count.reviews !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Min stay</span>
                <span className="font-medium">{h.minStayDays} night{h.minStayDays !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Max stay</span>
                <span className="font-medium">{h.maxStayDays} nights</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Rooms</span>
                <span className="font-medium">{h.rooms.length}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>District</span>
                <span className="font-medium">{h.district}</span>
              </div>
            </div>

            <ContactButton homestayId={h.id} ownerId={h.owner.id} slug={h.slug} />

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Hosted by</p>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold">
                  {(h.owner.name ?? 'H')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{h.owner.name ?? 'Host'}</p>
                  <p className="text-xs text-gray-400">Host since {hostSince}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
