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

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function nights(checkIn: string, checkOut: string) {
  return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
}

// ── Status stepper ──────────────────────────────────────────────────────────
const STEPS = [
  { key: 'pending',    label: 'Inquiry Sent',      icon: '📨' },
  { key: 'confirmed',  label: 'Host Confirmed',     icon: '✅' },
  { key: 'checked_in', label: 'Checked In',         icon: '🏡' },
  { key: 'checked_out',label: 'Stay Complete',      icon: '⭐' },
];

function stepIndex(status: string) {
  const idx = STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

function StatusStepper({ status }: { status: string }) {
  if (status === 'cancelled' || status === 'no_show') return null;
  const current = stepIndex(status);
  return (
    <div className="flex items-center gap-0 w-full my-3">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
              ${i < current  ? 'bg-green-500 text-white' :
                i === current ? 'bg-green-700 text-white ring-2 ring-green-200' :
                                'bg-gray-100 text-gray-400'}`}>
              {i < current ? '✓' : step.icon}
            </div>
            <p className={`text-[10px] mt-1 text-center leading-tight
              ${i === current ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>
              {step.label}
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 mt-[-14px] rounded
              ${i < current ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-700',
  confirmed:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-600',
  checked_in:  'bg-blue-100 text-blue-700',
  checked_out: 'bg-gray-100 text-gray-600',
  no_show:     'bg-orange-100 text-orange-700',
};
const STATUS_LABEL: Record<string, string> = {
  pending:     'Awaiting Confirmation',
  confirmed:   'Confirmed',
  cancelled:   'Cancelled',
  checked_in:  'Checked In',
  checked_out: 'Stay Complete',
  no_show:     'No Show',
};

// ── Next action CTA per status ───────────────────────────────────────────────
function NextAction({ booking }: { booking: Booking }) {
  if (booking.status === 'pending') {
    return (
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm">
        <p className="font-medium text-yellow-800">⏳ Waiting for host to confirm</p>
        <p className="text-yellow-600 text-xs mt-0.5">You&apos;ll be notified once the host reviews your request.</p>
      </div>
    );
  }
  if (booking.status === 'confirmed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
        <p className="font-semibold text-green-800 text-sm">🎉 Your stay is confirmed!</p>
        <p className="text-green-700 text-xs">Contact the host directly to arrange payment and check-in details.</p>
        <Link href={`/homestays/${booking.homestay.slug}`}
          className="inline-block mt-1 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          View Property & Contact Host →
        </Link>
      </div>
    );
  }
  if (booking.status === 'checked_in') {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
        <p className="font-medium text-blue-800">🏡 You&apos;re checked in — enjoy your stay!</p>
      </div>
    );
  }
  if (booking.status === 'checked_out') {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm flex items-center justify-between">
        <p className="text-gray-600">Hope you had a great stay!</p>
        <Link href={`/homestays/${booking.homestay.slug}`}
          className="text-xs text-green-700 font-medium hover:underline">
          Leave a review →
        </Link>
      </div>
    );
  }
  return null;
}

// ── Main content ────────────────────────────────────────────────────────────
function MyBookingsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const inquirySent  = searchParams.get('inquiry_sent') === '1';

  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [banner,     setBanner]     = useState(inquirySent);
  const [filter,     setFilter]     = useState<'all' | 'active' | 'past'>('all');

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { router.push('/login?redirect=/my-bookings'); return; }
    fetchBookings(token);

    // Auto-refresh every 60s so stepper advances when host confirms
    const interval = setInterval(() => {
      const t = sessionStorage.getItem('access_token');
      if (t) fetchBookings(t);
    }, 60_000);

    return () => clearInterval(interval);
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
      if (res.ok) setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    } finally {
      setCancelling(null);
    }
  }

  const ACTIVE = ['pending', 'confirmed', 'checked_in'];
  const PAST   = ['checked_out', 'cancelled', 'no_show'];

  const filtered = bookings.filter(b => {
    if (filter === 'active') return ACTIVE.includes(b.status);
    if (filter === 'past')   return PAST.includes(b.status);
    return true;
  });

  const activeCount = bookings.filter(b => ACTIVE.includes(b.status)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Success banner */}
        {banner && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-800">
            <span className="text-xl shrink-0">✅</span>
            <div className="flex-1">
              <p className="font-semibold">Inquiry sent!</p>
              <p className="text-green-600 text-xs mt-0.5">The host will review and confirm shortly.</p>
            </div>
            <button onClick={() => setBanner(false)} className="text-green-400 hover:text-green-600 text-lg">×</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-sm text-gray-500">Track your inquiries and reservations</p>
          </div>
          <Link href="/homestays"
            className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors">
            Browse More
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-5">
          {([
            { key: 'all',    label: `All (${bookings.length})` },
            { key: 'active', label: `Active (${activeCount})` },
            { key: 'past',   label: 'Past' },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors
                ${filter === f.key
                  ? 'text-green-700 border-b-2 border-green-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Booking cards */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">🏡</p>
            <p className="text-gray-600 font-medium">No {filter === 'all' ? '' : filter} bookings</p>
            {filter === 'all' && (
              <Link href="/homestays"
                className="inline-block mt-4 bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-800 transition-colors">
                Browse Homestays
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(b => (
              <div key={b.id}
                className={`bg-white rounded-2xl border p-5 space-y-3 transition-shadow hover:shadow-sm
                  ${b.status === 'confirmed' ? 'border-green-200' :
                    b.status === 'pending'   ? 'border-yellow-200' :
                                              'border-gray-100'}`}>

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/homestays/${b.homestay.slug}`}
                      className="font-semibold text-gray-900 hover:text-green-700 transition-colors">
                      {b.homestay.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">📍 {b.homestay.district}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted {fmt(b.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>

                {/* Status stepper */}
                {!['cancelled','no_show'].includes(b.status) && (
                  <StatusStepper status={b.status} />
                )}

                {/* Stay details */}
                <div className="grid grid-cols-4 gap-2 text-sm bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="text-xs text-gray-400">Check-in</p>
                    <p className="font-medium text-gray-800 text-xs">{fmt(b.checkIn)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Check-out</p>
                    <p className="font-medium text-gray-800 text-xs">{fmt(b.checkOut)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Guests</p>
                    <p className="font-medium text-gray-800">{b.guests}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{nights(b.checkIn, b.checkOut)}N</p>
                    <p className="font-bold text-green-700 text-sm">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Guest message */}
                {b.message && (
                  <div className="bg-blue-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-400 mb-0.5">Your message to host</p>
                    <p className="text-sm text-gray-700 italic">&ldquo;{b.message}&rdquo;</p>
                  </div>
                )}

                {/* Next action CTA */}
                <NextAction booking={b} />

                {/* Cancel */}
                {b.status === 'pending' && (
                  <button onClick={() => cancelBooking(b.id)} disabled={cancelling === b.id}
                    className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors">
                    {cancelling === b.id ? 'Cancelling…' : 'Cancel inquiry'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MyBookingsPage() {
  return <Suspense><MyBookingsContent /></Suspense>;
}
