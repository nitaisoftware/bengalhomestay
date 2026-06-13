'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams }    from 'next/navigation';
import Link                              from 'next/link';

interface Booking {
  id:          string;
  checkIn:     string;
  checkOut:    string;
  guests:      number;
  totalAmount: number;
  status:      string;
  message:     string | null;
  createdAt:   string;
  homestay:    { id: string; name: string; district: string; slug: string };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700' },
  confirmed:   { label: 'Confirmed',   color: 'bg-green-100 text-green-700'  },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-600'      },
  checked_in:  { label: 'Checked In',  color: 'bg-blue-100 text-blue-700'    },
  checked_out: { label: 'Checked Out', color: 'bg-gray-100 text-gray-600'    },
  no_show:     { label: 'No Show',     color: 'bg-orange-100 text-orange-700'},
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function MyBookingsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const inquirySent  = searchParams.get('inquiry_sent') === '1';

  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [banner,     setBanner]     = useState(inquirySent);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { router.push('/login?redirect=/my-bookings'); return; }
    fetchBookings(token);
  }, []);

  async function fetchBookings(token: string) {
    setLoading(true);
    try {
      const res  = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(id: string) {
    const token = sessionStorage.getItem('access_token') ?? '';
    setCancelling(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action: 'cancel' }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      }
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Home</Link>
        <span className="text-gray-200">|</span>
        <span className="text-sm font-medium text-gray-700">My Bookings</span>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {banner && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-800">
            <span className="text-xl shrink-0">✅</span>
            <div className="flex-1">
              <p className="font-semibold">Inquiry sent successfully!</p>
              <p className="text-green-600 text-xs mt-0.5">Your inquiry was submitted after sign-in. The host will review and confirm shortly.</p>
            </div>
            <button onClick={() => setBanner(false)} className="text-green-400 hover:text-green-600 text-lg leading-none">×</button>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Bookings</h1>
        <p className="text-sm text-gray-500 mb-6">Track your homestay inquiries and reservations.</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">🏡</p>
            <p className="text-gray-600 font-medium">No bookings yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Find a homestay and send your first inquiry.</p>
            <Link href="/homestays"
              className="inline-block bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-800 transition-colors">
              Browse Homestays
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const nights = Math.ceil(
                (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000
              );
              const st = STATUS_LABEL[b.status] ?? { label: b.status, color: 'bg-gray-100 text-gray-600' };

              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/homestays/${b.homestay.slug}`}
                        className="font-semibold text-gray-900 hover:text-green-700 transition-colors">
                        {b.homestay.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">📍 {b.homestay.district}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-xs text-gray-400">Check-in</p>
                      <p className="font-medium text-gray-800">{fmt(b.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Check-out</p>
                      <p className="font-medium text-gray-800">{fmt(b.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Guests</p>
                      <p className="font-medium text-gray-800">{b.guests} guest{b.guests > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Amount + message */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">{nights} night{nights > 1 ? 's' : ''}</p>
                      <p className="text-base font-bold text-green-700">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">Payment on confirmation</p>
                    </div>
                    {b.status === 'confirmed' && (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
                        ✅ Confirmed — contact host for payment
                      </span>
                    )}
                  </div>

                  {b.message && (
                    <div className="border-t border-gray-50 pt-2">
                      <p className="text-xs text-gray-400 mb-0.5">Your message</p>
                      <p className="text-sm text-gray-600 italic">&ldquo;{b.message}&rdquo;</p>
                    </div>
                  )}

                  {/* Cancel button */}
                  {b.status === 'pending' && (
                    <button
                      onClick={() => cancelBooking(b.id)}
                      disabled={cancelling === b.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                    >
                      {cancelling === b.id ? 'Cancelling…' : 'Cancel inquiry'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MyBookingsPage() {
  return <Suspense><MyBookingsContent /></Suspense>;
}
