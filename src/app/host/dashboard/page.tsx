'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter }  from 'next/navigation';
import Link           from 'next/link';
import StatsKPIRow    from '@/components/dashboard/StatsKPIRow';

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
}

interface Inquiry {
  id:          string;
  checkIn:     string;
  checkOut:    string;
  guests:      number;
  totalAmount: number;
  status:      string;
  message:     string | null;
  createdAt:   string;
  homestay:    { id: string; name: string; district: string };
  guest:       { id: string; name: string | null; mobile: string; email: string | null };
}

const BOOKING_COLORS: Record<string, string> = {
  confirmed:   'bg-green-100 text-green-700',
  pending:     'bg-yellow-100 text-yellow-700',
  checked_in:  'bg-blue-100 text-blue-700',
  checked_out: 'bg-gray-100 text-gray-500',
  cancelled:   'bg-red-100 text-red-600',
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function HostDashboardPage() {
  const router = useRouter();

  const [activeTab,  setActiveTab]  = useState<'overview' | 'inquiries' | 'rooms' | 'availability'>('overview');
  const [data,       setData]       = useState<DashboardData | null>(null);
  const [inquiries,  setInquiries]  = useState<Inquiry[]>([]);
  const [inqLoading, setInqLoading] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [acting,     setActing]     = useState<string | null>(null);

  const loadDashboard = useCallback((token: string) => {
    fetch('/api/owner/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.error) { router.push('/host/register'); return; }
        setData(d);
      })
      .catch(() => router.push('/host/register'))
      .finally(() => setLoading(false));
  }, [router]);

  const loadInquiries = useCallback((token: string) => {
    setInqLoading(true);
    fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setInquiries(d.bookings ?? []))
      .finally(() => setInqLoading(false));
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { router.push('/host/register'); return; }
    loadDashboard(token);
  }, [loadDashboard, router]);

  // Load inquiries when tab activated
  useEffect(() => {
    if (activeTab !== 'inquiries') return;
    const token = sessionStorage.getItem('access_token');
    if (token) loadInquiries(token);
  }, [activeTab, loadInquiries]);

  async function handleAction(id: string, action: 'confirm' | 'decline') {
    const token = sessionStorage.getItem('access_token') ?? '';
    setActing(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action }),
      });
      if (res.ok) {
        const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
        setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
      }
    } finally {
      setActing(null);
    }
  }

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

  // Count pending inquiries for badge
  const pendingCount = inquiries.filter(i => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Host Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your listings and bookings</p>
          </div>
        </div>

        {/* KPI row */}
        <StatsKPIRow stats={data.stats} />

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {[
            { key: 'overview',      label: 'Overview' },
            { key: 'inquiries',     label: 'Inquiries' },
            { key: 'rooms',         label: '🛏️ Rooms' },
            { key: 'availability',  label: '📅 Availability' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-green-700 border-b-2 border-green-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key === 'inquiries' && pendingCount > 0 && (
                <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 gap-6">

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
                    {data.recentBookings.map(b => (
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
                { label: 'Manage Rooms',       href: '/host/rooms',           emoji: '🛏️' },
                { label: 'Room Availability',  href: '/host/availability',    emoji: '📅' },
                { label: 'View Inquiries',     href: '#',                     emoji: '📬', onClick: () => setActiveTab('inquiries') },
                { label: 'Upgrade to Paid',    href: '/host/pricing',         emoji: '⭐' },
              ].map(q => (
                q.onClick ? (
                  <button key={q.label} onClick={q.onClick}
                    className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-green-200 hover:bg-green-50 transition-colors w-full">
                    <p className="text-2xl mb-1">{q.emoji}</p>
                    <p className="text-xs font-medium text-gray-700">{q.label}</p>
                  </button>
                ) : (
                  <Link key={q.label} href={q.href}
                    className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-green-200 hover:bg-green-50 transition-colors">
                    <p className="text-2xl mb-1">{q.emoji}</p>
                    <p className="text-xs font-medium text-gray-700">{q.label}</p>
                  </Link>
                )
              ))}
            </div>
          </>
        )}

        {/* ── INQUIRIES TAB ─────────────────────────────────────────────── */}
        {activeTab === 'inquiries' && (
          <div>
            {inqLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : inquiries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-4xl mb-3">📬</p>
                <p className="text-gray-600 font-medium">No inquiries yet</p>
                <p className="text-sm text-gray-400 mt-1">Guest inquiries will appear here once your listings go live.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map(inq => {
                  const nights = Math.ceil(
                    (new Date(inq.checkOut).getTime() - new Date(inq.checkIn).getTime()) / 86400000
                  );
                  const isPending = inq.status === 'pending';

                  return (
                    <div key={inq.id}
                      className={`bg-white rounded-2xl border p-5 space-y-3 ${isPending ? 'border-yellow-200' : 'border-gray-100'}`}>

                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{inq.homestay.name}</p>
                          <p className="text-xs text-gray-400">📍 {inq.homestay.district}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${BOOKING_COLORS[inq.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {inq.status.charAt(0).toUpperCase() + inq.status.slice(1)}
                        </span>
                      </div>

                      {/* Guest info */}
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold flex items-center justify-center shrink-0">
                          {(inq.guest.name ?? inq.guest.mobile)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{inq.guest.name ?? 'Guest'}</p>
                          <p className="text-xs text-gray-400">{inq.guest.mobile}{inq.guest.email ? ` · ${inq.guest.email}` : ''}</p>
                        </div>
                      </div>

                      {/* Stay details */}
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">Check-in</p>
                          <p className="font-medium text-gray-800">{fmt(inq.checkIn)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Check-out</p>
                          <p className="font-medium text-gray-800">{fmt(inq.checkOut)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Guests</p>
                          <p className="font-medium text-gray-800">{inq.guests}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{nights}N total</p>
                          <p className="font-bold text-green-700">₹{inq.totalAmount.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      {inq.message && (
                        <div className="bg-blue-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-blue-500 mb-0.5">Guest message</p>
                          <p className="text-sm text-gray-700 italic">&ldquo;{inq.message}&rdquo;</p>
                        </div>
                      )}

                      {/* Actions — only for pending */}
                      {isPending && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAction(inq.id, 'confirm')}
                            disabled={acting === inq.id}
                            className="flex-1 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                          >
                            {acting === inq.id ? '…' : '✅ Confirm'}
                          </button>
                          <button
                            onClick={() => handleAction(inq.id, 'decline')}
                            disabled={acting === inq.id}
                            className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-semibold py-2 rounded-xl transition-colors"
                          >
                            {acting === inq.id ? '…' : '✕ Decline'}
                          </button>
                        </div>
                      )}

                      {inq.status === 'confirmed' && (
                        <p className="text-xs text-green-600 font-medium">
                          ✅ Confirmed · Arrange payment directly with the guest.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ROOMS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'rooms' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
            <p className="text-4xl">🛏️</p>
            <p className="text-lg font-semibold text-gray-800">Manage Rooms</p>
            <p className="text-sm text-gray-500">Add, edit, or deactivate rooms for your property.</p>
            <a href="/host/rooms"
              className="inline-block bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
              Open Room Manager →
            </a>
          </div>
        )}

        {/* ── AVAILABILITY TAB ──────────────────────────────────────────── */}
        {activeTab === 'availability' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
            <p className="text-4xl">📅</p>
            <p className="text-lg font-semibold text-gray-800">Room Availability</p>
            <p className="text-sm text-gray-500">Control which rooms are open on specific dates. Set vacation blocks.</p>
            <a href="/host/availability"
              className="inline-block bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
              Open Availability Calendar →
            </a>
          </div>
        )}

      </main>
    </div>
  );
}
