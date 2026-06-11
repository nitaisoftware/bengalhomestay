'use client';

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import Link                    from 'next/link';
import StatsKPIRow             from '@/components/dashboard/StatsKPIRow';

interface DashboardData {
  stats: {
    totalListings:    number;
    approvedListings: number;
    pendingListings:  number;
    totalBookings:    number;
    todayBookings:    number;
    monthRevenue:     number;
  };
  recentBookings: any[];
  myListings:     any[];
}

const STATUS_COLORS: Record<string, string> = {
  approved:       'bg-green-100 text-green-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  draft:          'bg-gray-100 text-gray-500',
  rejected:       'bg-red-100 text-red-600',
  suspended:      'bg-red-100 text-red-600',
};

const BOOKING_COLORS: Record<string, string> = {
  confirmed:   'bg-green-100 text-green-700',
  pending:     'bg-yellow-100 text-yellow-700',
  checked_in:  'bg-blue-100 text-blue-700',
  checked_out: 'bg-gray-100 text-gray-500',
  cancelled:   'bg-red-100 text-red-600',
};

export default function HostDashboardPage() {
  const router = useRouter();
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState<any>(null);

  useEffect(() => {
    const token    = sessionStorage.getItem('access_token');
    const userJson = sessionStorage.getItem('user');

    if (!token) {
      router.push('/host/register');
      return;
    }

    if (userJson) setUser(JSON.parse(userJson));

    fetch('/api/owner/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { router.push('/host/register'); return; }
        setData(d);
      })
      .catch(() => router.push('/host/register'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Host Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your listings and bookings</p>
          </div>
          <Link
            href="/host/listings/new"
            className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Add Listing
          </Link>
        </div>

        {/* KPI row */}
        <StatsKPIRow stats={data.stats} />

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* My Listings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">My Listings</h2>
              <Link href="/host/listings/new" className="text-xs text-green-700 hover:underline">
                + Add new
              </Link>
            </div>

            {data.myListings.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-3">🏡</p>
                <p className="text-sm font-medium text-gray-700">No listings yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Add your first homestay to get started</p>
                <Link
                  href="/host/listings/new"
                  className="inline-block bg-green-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Add your first listing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.myListings.map((listing) => (
                  <div key={listing.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                      {listing.images[0] && (
                        <img src={listing.images[0].url} alt={listing.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{listing.name}</p>
                      <p className="text-xs text-gray-400">{listing.district} · ₹{listing.pricePerNight.toLocaleString('en-IN')}/night</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[listing.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {listing.status.replace('_', ' ')}
                      </span>
                      <Link href={`/host/listings/${listing.id}/edit`} className="text-xs text-gray-400 hover:text-green-700">
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Bookings</h2>

            {data.recentBookings.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-3">📅</p>
                <p className="text-sm font-medium text-gray-700">No bookings yet</p>
                <p className="text-xs text-gray-400 mt-1">Bookings will appear here once guests book your listings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentBookings.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{b.homestay.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BOOKING_COLORS[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {b.guest.name ?? b.guest.mobile} · {new Date(b.checkIn).toLocaleDateString('en-IN')} → {new Date(b.checkOut).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-xs font-semibold text-green-700 mt-1">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Listing',      href: '/host/listings/new',  emoji: '➕' },
            { label: 'View Bookings',    href: '/host/dashboard/week', emoji: '📅' },
            { label: 'Revenue Report',   href: '/host/dashboard/month', emoji: '💰' },
            { label: 'Upgrade to Paid',  href: '/host/pricing',        emoji: '⭐' },
          ].map((q) => (
            <Link
              key={q.label}
              href={q.href}
              className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-green-200 hover:bg-green-50 transition-colors"
            >
              <p className="text-2xl mb-1">{q.emoji}</p>
              <p className="text-xs font-medium text-gray-700">{q.label}</p>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
