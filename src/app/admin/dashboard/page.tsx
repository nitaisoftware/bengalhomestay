'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Listing {
  id:            string;
  name:          string;
  district:      string;
  address:       string | null;
  pricePerNight: number;
  status:        string;
  amenities:     string[];
  description:   string | null;
  createdAt:     string;
  owner:         { id: string; name: string | null; mobile: string | null; email: string | null };
  images:        { url: string }[];
  rooms:         { id: string; name: string; pricePerNight: number; capacity: number; bedType: string | null; amenities: string[] }[];
  categories:    { category: { name: string; group: string } }[];
  _count:        { bookings: number; reviews: number };
}

interface Stats {
  pendingCount:  number;
  approvedCount: number;
  rejectedCount: number;
  totalUsers:    number;
}

const STATUS_TAB = ['pending_review', 'approved', 'rejected', 'suspended'] as const;
type StatusTab = typeof STATUS_TAB[number];

const TAB_LABELS: Record<StatusTab, string> = {
  pending_review: 'Pending',
  approved:       'Approved',
  rejected:       'Rejected',
  suspended:      'Suspended',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [listings,    setListings]    = useState<Listing[]>([]);
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [activeTab,   setActiveTab]   = useState<StatusTab>('pending_review');
  const [loading,     setLoading]     = useState(true);
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [expanded,    setExpanded]    = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

  async function fetchListings(status: StatusTab) {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/listings?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 403) { router.push('/'); return; }
      if (res.status === 401) { router.push('/host/register'); return; }
      setListings(data.listings ?? []);
      if (data.stats) setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) { router.push('/host/register'); return; }
    fetchListings(activeTab);
  }, [activeTab]);

  async function handleAction(id: string, action: 'approve' | 'reject' | 'suspend') {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ action }),
      });
      if (res.ok) fetchListings(activeTab);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Pending Review', value: stats.pendingCount,  color: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
              { label: 'Approved Live',  value: stats.approvedCount, color: 'bg-green-50 border-green-100 text-green-700'   },
              { label: 'Rejected',       value: stats.rejectedCount, color: 'bg-red-50 border-red-100 text-red-600'         },
              { label: 'Total Users',    value: stats.totalUsers,    color: 'bg-blue-50 border-blue-100 text-blue-700'      },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-4 ${s.color.split(' ').slice(0, 2).join(' ')}`}>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[2]}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit">
          {STATUS_TAB.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-green-700 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[tab]}
              {tab === 'pending_review' && stats?.pendingCount ? (
                <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">
                  {stats.pendingCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm">No {TAB_LABELS[activeTab].toLowerCase()} listings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((l) => (
              <div key={l.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-start gap-4 p-5">
                  {/* Cover image */}
                  <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                    {l.images[0] ? (
                      <img src={l.images[0].url} alt={l.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🏡</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{l.name}</h3>
                        <p className="text-sm text-gray-500">{l.district}{l.address ? ` · ${l.address}` : ''}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Owner: <span className="font-medium text-gray-700">{l.owner.name ?? 'Unknown'}</span>
                          {l.owner.mobile && <span className="ml-2 text-gray-400">{l.owner.mobile}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-green-700">₹{l.pricePerNight.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400">per night</p>
                        <p className="text-xs text-gray-400 mt-1">{l.rooms.length} room{l.rooms.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Categories */}
                    {l.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {l.categories.map((c, i) => (
                          <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            {c.category.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Property amenities */}
                    {l.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {l.amenities.map((a) => (
                          <span key={a} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description + expand */}
                {l.description && (
                  <div className="px-5 pb-3">
                    <p className={`text-sm text-gray-600 ${expanded === l.id ? '' : 'line-clamp-2'}`}>{l.description}</p>
                    <button onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                      className="text-xs text-green-700 hover:underline mt-1">
                      {expanded === l.id ? 'Show less' : 'Read more'}
                    </button>
                  </div>
                )}

                {/* Rooms */}
                {l.rooms.length > 0 && expanded === l.id && (
                  <div className="px-5 pb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rooms</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {l.rooms.map((r) => (
                        <div key={r.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-800">{r.name}</span>
                            <span className="font-semibold text-green-700">₹{r.pricePerNight.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {r.bedType} · {r.capacity} guest{r.capacity !== 1 ? 's' : ''}
                          </p>
                          {r.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {r.amenities.map((a) => (
                                <span key={a} className="text-xs bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{a}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Submitted {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex gap-2">
                    {activeTab === 'pending_review' && (
                      <>
                        <button
                          onClick={() => handleAction(l.id, 'reject')}
                          disabled={actionId === l.id}
                          className="px-4 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(l.id, 'approve')}
                          disabled={actionId === l.id}
                          className="px-4 py-1.5 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
                        >
                          {actionId === l.id ? 'Processing...' : 'Approve'}
                        </button>
                      </>
                    )}
                    {activeTab === 'approved' && (
                      <button
                        onClick={() => handleAction(l.id, 'suspend')}
                        disabled={actionId === l.id}
                        className="px-4 py-1.5 text-sm border border-orange-200 text-orange-500 rounded-lg hover:bg-orange-50 disabled:opacity-50 transition-colors"
                      >
                        Suspend
                      </button>
                    )}
                    {(activeTab === 'rejected' || activeTab === 'suspended') && (
                      <button
                        onClick={() => handleAction(l.id, 'approve')}
                        disabled={actionId === l.id}
                        className="px-4 py-1.5 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
                      >
                        Re-approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
