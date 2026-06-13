'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Room {
  id:            string;
  name:          string;
  description:   string | null;
  capacity:      number;
  bedType:       string | null;
  pricePerNight: number;
  amenities:     string[];
}

interface Homestay {
  id:       string;
  name:     string;
  district: string;
  status:   string;
  rooms:    Room[];
}

const BED_TYPES = ['Single', 'Double', 'Twin', 'Triple', 'Queen', 'King', 'Dormitory'];

const FACILITIES = [
  { label: 'Free Wi-Fi',       icon: '📶' },
  { label: 'Geyser',           icon: '🚿' },
  { label: 'Air Conditioning', icon: '❄️' },
  { label: 'Parking',          icon: '🚗' },
  { label: 'Mountain View',    icon: '🏔️' },
  { label: 'Sea View',         icon: '🌊' },
  { label: 'Garden View',      icon: '🌿' },
  { label: 'Balcony',          icon: '🪟' },
  { label: 'Room Service',     icon: '🛎️' },
  { label: 'Pet-friendly',     icon: '🐾' },
  { label: 'Free Breakfast',   icon: '☕' },
  { label: 'TV',               icon: '📺' },
  { label: 'Attached Bath',    icon: '🛁' },
  { label: 'Hot Water',        icon: '♨️' },
  { label: 'Wheelchair Access',icon: '♿' },
];

const EMPTY_FORM = {
  name: '', description: '', capacity: 2, bedType: 'Double', pricePerNight: '', amenities: [] as string[],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ManageRoomsPage() {
  const router = useRouter();

  const [homestays,    setHomestays]    = useState<Homestay[]>([]);
  const [activeHsIdx,  setActiveHsIdx]  = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState<'add' | 'edit' | null>(null);
  const [editRoom,     setEditRoom]     = useState<Room | null>(null);
  const [form,         setForm]         = useState({ ...EMPTY_FORM });
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [confirmDel,   setConfirmDel]   = useState(false);
  const [error,        setError]        = useState('');

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

  const fetchRooms = useCallback(async () => {
    if (!token) { router.push('/host/login'); return; }
    const userJson = sessionStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    if (!user || user.role !== 'host') { router.push('/'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/owner/rooms', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.push('/host/login'); return; }
      const data = await res.json();
      setHomestays(data.homestays ?? []);
    } finally { setLoading(false); }
  }, [token, router]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const activeHomestay = homestays[activeHsIdx] ?? null;

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditRoom(null);
    setConfirmDel(false);
    setError('');
    setModal('add');
  }

  function openEdit(room: Room) {
    setForm({
      name:          room.name,
      description:   room.description ?? '',
      capacity:      room.capacity,
      bedType:       room.bedType ?? 'Double',
      pricePerNight: String(room.pricePerNight),
      amenities:     [...room.amenities],
    });
    setEditRoom(room);
    setConfirmDel(false);
    setError('');
    setModal('edit');
  }

  function closeModal() { setModal(null); setEditRoom(null); setConfirmDel(false); setError(''); }

  function toggleAmenity(label: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(label)
        ? f.amenities.filter(a => a !== label)
        : [...f.amenities, label],
    }));
  }

  // ── Save (add or edit) ────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim())        { setError('Room name is required'); return; }
    if (!form.pricePerNight)      { setError('Price per night is required'); return; }
    setError('');
    setSaving(true);
    try {
      if (modal === 'add') {
        const res  = await fetch('/api/owner/rooms', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ ...form, homestayId: activeHomestay!.id }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Failed to add room'); return; }
        setHomestays(prev => prev.map((hs, i) =>
          i === activeHsIdx ? { ...hs, rooms: [...hs.rooms, data.room] } : hs
        ));
      } else if (modal === 'edit' && editRoom) {
        const res  = await fetch(`/api/owner/rooms/${editRoom.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Failed to update room'); return; }
        setHomestays(prev => prev.map((hs, i) =>
          i === activeHsIdx
            ? { ...hs, rooms: hs.rooms.map(r => r.id === editRoom.id ? data.room : r) }
            : hs
        ));
      }
      closeModal();
    } finally { setSaving(false); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!editRoom) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/owner/rooms/${editRoom.id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Delete failed'); return; }
      setHomestays(prev => prev.map((hs, i) =>
        i === activeHsIdx ? { ...hs, rooms: hs.rooms.filter(r => r.id !== editRoom.id) } : hs
      ));
      closeModal();
    } finally { setDeleting(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading rooms…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ── */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/host/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
              ← Dashboard
            </Link>
            <div>
              <p className="text-sm font-semibold text-gray-900">Manage Rooms</p>
              {activeHomestay && (
                <p className="text-xs text-gray-400">
                  {activeHomestay.rooms.length} room{activeHomestay.rooms.length !== 1 ? 's' : ''} · {activeHomestay.name}
                </p>
              )}
            </div>
          </div>
          {activeHomestay && (
            <button onClick={openAdd}
              className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
              + Add Room
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* No homestays at all */}
        {homestays.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <p className="text-4xl mb-4">🏡</p>
            <p className="font-semibold text-gray-800 mb-2">No property registered yet</p>
            <p className="text-sm text-gray-400 mb-6">Register your homestay first, then come back to add rooms.</p>
            <Link href="/host/listings/new"
              className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl inline-block transition-colors">
              Register a Property
            </Link>
          </div>
        )}

        {/* Homestay selector (if host owns >1 property) */}
        {homestays.length > 1 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {homestays.map((hs, i) => (
              <button key={hs.id} onClick={() => setActiveHsIdx(i)}
                className={`text-sm px-4 py-2 rounded-xl border transition-colors ${
                  i === activeHsIdx
                    ? 'bg-green-700 text-white border-green-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                }`}>
                {hs.name}
              </button>
            ))}
          </div>
        )}

        {/* Room grid */}
        {activeHomestay && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

            {activeHomestay.rooms.map(room => (
              <button key={room.id} onClick={() => openEdit(room)}
                className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-green-300 hover:shadow-sm transition-all active:scale-95 group">

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl mb-3 group-hover:bg-green-50 transition-colors">
                  🛏️
                </div>

                {/* Name */}
                <p className="text-sm font-semibold text-gray-900 mb-1 truncate">{room.name}</p>

                {/* Spec */}
                <p className="text-xs text-gray-400 mb-3">
                  {room.capacity} guest{room.capacity !== 1 ? 's' : ''}
                  {room.bedType ? ` · ${room.bedType}` : ''}
                </p>

                {/* Top amenities */}
                {room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {room.amenities.slice(0, 3).map(a => (
                      <span key={a} className="text-[10px] bg-gray-50 text-gray-500 border border-gray-100 px-2 py-0.5 rounded-full">
                        {a}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{room.amenities.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Price */}
                <p className="text-sm font-bold text-green-700">
                  ₹{Number(room.pricePerNight).toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-gray-400"> / night</span>
                </p>
              </button>
            ))}

            {/* Add room card */}
            <button onClick={openAdd}
              className="bg-white border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[160px] gap-2 hover:border-green-400 hover:bg-green-50 transition-all active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">➕</div>
              <p className="text-xs text-gray-400 font-medium">Add new room</p>
            </button>

          </div>
        )}

        {/* Empty rooms state */}
        {activeHomestay && activeHomestay.rooms.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">No rooms yet — click <strong>+ Add Room</strong> to get started.</p>
          </div>
        )}

      </main>

      {/* ── Modal (Add / Edit) ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-gray-900">
                {modal === 'add' ? '➕ Add New Room' : `✏️ Edit — ${editRoom?.name}`}
              </h2>
              <button onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors text-lg">
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Room Name <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Deluxe Mountain View"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              {/* Specs row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Capacity <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                    <button type="button" onClick={() => setForm(f => ({ ...f, capacity: Math.max(1, f.capacity - 1) }))}
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-bold flex items-center justify-center">−</button>
                    <span className="flex-1 text-center text-sm font-medium">
                      {form.capacity} guest{form.capacity !== 1 ? 's' : ''}
                    </span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, capacity: Math.min(20, f.capacity + 1) }))}
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-bold flex items-center justify-center">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Price / night <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-600">
                    <span className="px-3 py-2.5 bg-gray-50 text-xs text-gray-400 border-r border-gray-200">₹</span>
                    <input type="number" min="0" value={form.pricePerNight}
                      onChange={e => setForm(f => ({ ...f, pricePerNight: e.target.value }))}
                      placeholder="1500"
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bed type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Bed Type</label>
                <div className="flex flex-wrap gap-2">
                  {BED_TYPES.map(b => (
                    <button key={b} type="button" onClick={() => setForm(f => ({ ...f, bedType: b }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        form.bedType === b
                          ? 'bg-green-700 text-white border-green-700'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                      }`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Facilities &amp; Utilities
                </label>
                <div className="flex flex-wrap gap-2">
                  {FACILITIES.map(f => {
                    const on = form.amenities.includes(f.label);
                    return (
                      <button key={f.label} type="button" onClick={() => toggleAmenity(f.label)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          on
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}>
                        <span>{f.icon}</span>{f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Description <span className="text-gray-300 font-normal normal-case">(optional)</span>
                </label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Describe what makes this room special…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

            </div>

            {/* Modal footer */}
            <div className={`flex items-center px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white ${
              modal === 'edit' ? 'justify-between' : 'justify-end gap-3'
            }`}>

              {/* Delete — edit mode only */}
              {modal === 'edit' && (
                confirmDel ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-500 font-medium">Sure?</span>
                    <button onClick={handleDelete} disabled={deleting}
                      className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button onClick={() => setConfirmDel(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDel(true)}
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium border border-red-100">
                    🗑 Delete room
                  </button>
                )
              )}

              <div className="flex gap-2">
                <button onClick={closeModal}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="text-sm bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold px-5 py-2 rounded-xl transition-colors">
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Room' : 'Save Changes'}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
