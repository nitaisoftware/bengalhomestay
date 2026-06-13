'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface AdminUser {
  id:        string;
  name:      string | null;
  mobile:    string | null;
  email:     string | null;
  role:      string;
  tier:      string;
  createdAt: string;
  _count:    { homestays: number; bookings: number };
}

interface Stats {
  pendingCount:  number;
  approvedCount: number;
  rejectedCount: number;
  totalUsers:    number;
}

const LISTING_TABS   = ['pending_review', 'approved', 'rejected', 'suspended'] as const;
type ListingTab = typeof LISTING_TABS[number];
const TAB_LABELS: Record<ListingTab, string> = {
  pending_review: 'Pending', approved: 'Approved', rejected: 'Rejected', suspended: 'Suspended',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  host:  'bg-amber-100 text-amber-700',
  guest: 'bg-green-100 text-green-700',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const router = useRouter();

  const [mainTab,     setMainTab]     = useState<'listings' | 'users'>('listings');
  const [listings,    setListings]    = useState<Listing[]>([]);
  const [users,       setUsers]       = useState<AdminUser[]>([]);
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [activeTab,   setActiveTab]   = useState<ListingTab>('pending_review');
  const [loading,     setLoading]     = useState(true);
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [userSearch,  setUserSearch]  = useState('');
  const [userRole,    setUserRole]    = useState('');
  const [deleteModal, setDeleteModal] = useState<AdminUser | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

  const fetchListings = useCallback(async (status: ListingTab) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/listings?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 403) { router.push('/'); return; }
      if (res.status === 401) { router.push('/login?redirect=/admin/dashboard'); return; }
      setListings(data.listings ?? []);
      if (data.stats) setStats(data.stats);
    } finally { setLoading(false); }
  }, [token, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userRole)   params.set('role', userRole);
      if (userSearch) params.set('search', userSearch);
      const res  = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally { setLoading(false); }
  }, [token, userRole, userSearch]);

  useEffect(() => {
    if (!token) { router.push('/login?redirect=/admin/dashboard'); return; }
    if (mainTab === 'listings') fetchListings(activeTab);
    else fetchUsers();
  }, [mainTab, activeTab]);

  async function handleListingAction(id: string, action: 'approve' | 'reject' | 'suspend') {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchListings(activeTab);
    } finally { setActionId(null); }
  }

  async function handleDeleteUser() {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteModal.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== deleteModal.id));
        setDeleteModal(null);
        if (stats) setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
      }
    } finally { setDeleting(false); }
  }

  async function handleChangeRole(userId: string, role: string) {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">🔐 Administrator</span>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Pending Review', value: stats.pendingCount,  color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
              { label: 'Approved Live',  value: stats.approvedCount, color: 'bg-green-50 border-green-200 text-green-700'    },
              { label: 'Rejected',       value: stats.rejectedCount, color: 'bg-red-50 border-red-200 text-red-600'          },
              { label: 'Total Users',    value: stats.totalUsers,    color: 'bg-blue-50 border-blue-200 text-blue-700'       },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 ${s.color.split(' ').slice(0,2).join(' ')}`}>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[2]}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main tabs: Listings | Users */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['listings', 'users'] as const).map(tab => (
            <button key={tab} onClick={() => setMainTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                mainTab === tab
                  ? 'text-green-700 border-b-2 border-green-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab === 'listings' ? '🏡 Listings' : '👥 Users'}
            </button>
          ))}
        </div>

        {/* ── LISTINGS TAB ── */}
        {mainTab === 'listings' && (
          <>
            <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit">
              {LISTING_TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab ? 'bg-green-700 text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {TAB_LABELS[tab]}
                  {tab === 'pending_review' && stats?.pendingCount ? (
                    <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">
                      {stats.pendingCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">Loading...</div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-3xl mb-3">✅</p>
                <p className="text-sm">No {TAB_LABELS[activeTab].toLowerCase()} listings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map(l => (
                  <div key={l.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-start gap-4 p-5">
                      <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                        {l.images[0] ? (
                          <img src={l.images[0].url} alt={l.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🏡</div>
                        )}
                      </div>
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
                            <p className="text-xs text-gray-400">per night · {l.rooms.length} room{l.rooms.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        {l.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {l.categories.map((c, i) => (
                              <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{c.category.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {l.description && (
                      <div className="px-5 pb-3">
                        <p className={`text-sm text-gray-600 ${expanded === l.id ? '' : 'line-clamp-2'}`}>{l.description}</p>
                        <button onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                          className="text-xs text-green-700 hover:underline mt-1">
                          {expanded === l.id ? 'Show less' : 'Read more'}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="flex gap-2">
                        {activeTab === 'pending_review' && (
                          <>
                            <button onClick={() => handleListingAction(l.id, 'reject')} disabled={actionId === l.id}
                              className="px-4 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50">
                              Reject
                            </button>
                            <button onClick={() => handleListingAction(l.id, 'approve')} disabled={actionId === l.id}
                              className="px-4 py-1.5 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">
                              {actionId === l.id ? 'Processing...' : 'Approve'}
                            </button>
                          </>
                        )}
                        {activeTab === 'approved' && (
                          <button onClick={() => handleListingAction(l.id, 'suspend')} disabled={actionId === l.id}
                            className="px-4 py-1.5 text-sm border border-orange-200 text-orange-500 rounded-lg hover:bg-orange-50 disabled:opacity-50">
                            Suspend
                          </button>
                        )}
                        {(activeTab === 'rejected' || activeTab === 'suspended') && (
                          <button onClick={() => handleListingAction(l.id, 'approve')} disabled={actionId === l.id}
                            className="px-4 py-1.5 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">
                            Re-approve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── USERS TAB ── */}
        {mainTab === 'users' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <input
                type="text" placeholder="Search by name or mobile…" value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 w-64"
              />
              <select value={userRole} onChange={e => { setUserRole(e.target.value); }}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white">
                <option value="">All Roles</option>
                <option value="guest">Guest</option>
                <option value="host">Host</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={fetchUsers}
                className="bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-800 transition-colors">
                Search
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-3xl mb-3">👥</p>
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Listings</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bookings</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center shrink-0">
                              {(u.name ?? u.mobile ?? '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{u.name ?? <span className="text-gray-400 italic">No name</span>}</p>
                              <p className="text-xs text-gray-400">{u.mobile}{u.email ? ` · ${u.email}` : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={u.role}
                            onChange={e => handleChangeRole(u.id, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600 ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            <option value="guest">guest</option>
                            <option value="host">host</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{u._count.homestays}</td>
                        <td className="px-5 py-4 text-gray-600">{u._count.bookings}</td>
                        <td className="px-5 py-4 text-xs text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setDeleteModal(u)}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </main>

      {/* ── Delete confirmation modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-5">
              <p className="text-4xl mb-3">⚠️</p>
              <h3 className="text-lg font-bold text-gray-900">Delete User?</h3>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete{' '}
                <span className="font-semibold text-gray-800">{deleteModal.name ?? deleteModal.mobile}</span>{' '}
                and all their data including{' '}
                <span className="font-semibold">{deleteModal._count.homestays} listing(s)</span> and{' '}
                <span className="font-semibold">{deleteModal._count.bookings} booking(s)</span>.
              </p>
              <p className="text-xs text-red-500 mt-2 font-medium">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
