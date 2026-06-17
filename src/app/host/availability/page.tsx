'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Room {
  id: string; name: string; bedType: string | null;
  capacity: number; pricePerNight: number;
}
interface Homestay { id: string; name: string; }
interface DayCell {
  date: string; available: number; total: number;
  booked: number; disabled: number;
  status: 'available' | 'limited' | 'full';
}

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Helpers ────────────────────────────────────────────────────────────────────
function token() { return sessionStorage.getItem('access_token') ?? ''; }

function fmt(d: Date) { return d.toISOString().split('T')[0]; }

function statusColor(s: DayCell['status'], disabled: number) {
  if (disabled > 0 && s === 'full') return 'bg-gray-200 text-gray-400';
  if (s === 'full')    return 'bg-red-100 text-red-700';
  if (s === 'limited') return 'bg-amber-100 text-amber-700';
  return 'bg-green-50 text-green-700';
}

// ── Main Component ──────────────────────────────────────────────────────────────
export default function HostAvailabilityPage() {
  const router = useRouter();

  // Auth
  const [user,       setUser]       = useState<{ role: string } | null>(null);
  const [homestays,  setHomestays]  = useState<Homestay[]>([]);
  const [selected,   setSelected]   = useState<string>('');

  // View state
  const [view,       setView]       = useState<'month' | 'day'>('month');
  const [year,       setYear]       = useState(new Date().getFullYear());
  const [month,      setMonth]      = useState(new Date().getMonth());
  const [activeDay,  setActiveDay]  = useState<string>(fmt(new Date()));

  // Data
  const [calendar,   setCalendar]   = useState<DayCell[]>([]);
  const [rooms,      setRooms]      = useState<Room[]>([]);
  const [disabled,   setDisabled]   = useState<Record<string, string[]>>({});
  const [loading,    setLoading]    = useState(false);

  // Vacation mode modal
  const [vacModal,   setVacModal]   = useState(false);
  const [vacFrom,    setVacFrom]    = useState('');
  const [vacTo,      setVacTo]      = useState('');
  const [vacReason,  setVacReason]  = useState('Vacation');
  const [vacBusy,    setVacBusy]    = useState(false);

  // Toast
  const [toast,      setToast]      = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('user');
    if (!raw) { router.push('/host/login'); return; }
    const u = JSON.parse(raw);
    if (u.role !== 'host') { router.push('/'); return; }
    setUser(u);
  }, [router]);

  // ── Load homestays list ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    fetch('/api/owner/homestays', { headers: { authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => {
        const list = d.homestays ?? [];
        setHomestays(list);
        if (list.length > 0) setSelected(list[0].id);
      });
  }, [user]);

  // ── Load month calendar + room data ──────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const [calRes, roomRes] = await Promise.all([
        fetch(`/api/homestays/availability?homestayId=${selected}&year=${year}&month=${month}`),
        fetch(`/api/owner/availability?homestayId=${selected}&year=${year}&month=${month}`,
          { headers: { authorization: `Bearer ${token()}` } }),
      ]);
      const calData  = await calRes.json();
      const roomData = await roomRes.json();
      setCalendar(calData.availability ?? []);
      setRooms(roomData.rooms ?? []);
      setDisabled(roomData.disabledByRoom ?? {});
    } finally {
      setLoading(false);
    }
  }, [selected, year, month]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Toggle single room on a date ─────────────────────────────────────────
  async function toggleRoom(roomId: string, date: string, currentlyDisabled: boolean) {
    const res = await fetch('/api/owner/availability', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token()}` },
      body:    JSON.stringify({ roomId, date, isEnabled: currentlyDisabled }),
    });
    if (!res.ok) { showToast('Failed to update'); return; }

    // Optimistic update
    setDisabled(prev => {
      const next = { ...prev };
      if (currentlyDisabled) {
        // Re-enabling: remove date from disabled list
        next[roomId] = (next[roomId] ?? []).filter(d => d !== date);
      } else {
        // Disabling: add date
        next[roomId] = [...(next[roomId] ?? []), date];
      }
      return next;
    });
    showToast(currentlyDisabled ? '✅ Room enabled' : '🔒 Room disabled');
    loadData();
  }

  // ── Vacation mode ─────────────────────────────────────────────────────────
  async function applyVacation(unblock = false) {
    if (!vacFrom || !vacTo || !selected) return;
    setVacBusy(true);
    const res = await fetch('/api/owner/availability', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token()}` },
      body:    JSON.stringify({ homestayId: selected, from: vacFrom, to: vacTo, reason: vacReason, unblock }),
    });
    setVacBusy(false);
    if (!res.ok) { showToast('Failed'); return; }
    setVacModal(false);
    showToast(unblock ? '✅ Dates unblocked' : `🏖️ Vacation mode applied (${vacFrom} → ${vacTo})`);
    loadData();
  }

  // ── Day view helpers ──────────────────────────────────────────────────────
  const dayCell = calendar.find(c => c.date === activeDay);

  function isRoomDisabled(roomId: string, date: string) {
    return (disabled[roomId] ?? []).includes(date);
  }

  // ── Calendar grid ─────────────────────────────────────────────────────────
  function buildCalendarGrid() {
    const firstDay = new Date(year, month, 1).getDay();
    const cells: (DayCell | null)[] = Array(firstDay).fill(null);
    cells.push(...calendar);
    // pad to complete last week
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  if (!user) return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Room Availability</h1>
          <p className="text-sm text-gray-500">Manage which rooms are open for booking</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Homestay selector */}
          {homestays.length > 1 && (
            <select value={selected} onChange={e => setSelected(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2">
              {homestays.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}

          {/* View switcher */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['month', 'day'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors
                  ${view === v ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {v}
              </button>
            ))}
          </div>

          {/* Vacation mode */}
          <button onClick={() => setVacModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
            🏖️ Vacation Mode
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Month navigator */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600">◀</button>
          <h2 className="text-lg font-semibold text-gray-800">{MONTHS[month]} {year}</h2>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600">▶</button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block"/>Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 inline-block"/>Limited</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block"/>Fully Booked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block"/>Host Blocked</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : view === 'month' ? (

          /* ── MONTH VIEW ── */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
              ))}
            </div>
            {/* Cells */}
            <div className="grid grid-cols-7">
              {buildCalendarGrid().map((cell, i) => {
                if (!cell) return <div key={i} className="h-20 border-r border-b border-gray-50 bg-gray-50/50" />;
                const isToday = cell.date === fmt(new Date());
                const isActive = cell.date === activeDay;
                return (
                  <div key={cell.date}
                    onClick={() => { setActiveDay(cell.date); setView('day'); }}
                    className={`h-20 border-r border-b border-gray-50 p-1.5 cursor-pointer hover:bg-gray-50 transition-colors
                      ${isActive ? 'ring-2 ring-inset ring-green-500' : ''}
                      ${isToday ? 'bg-green-50/40' : ''}`}>
                    <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-green-700' : 'text-gray-700'}`}>
                      {new Date(cell.date + 'T00:00:00').getDate()}
                    </div>
                    <div className={`text-xs rounded px-1 py-0.5 ${statusColor(cell.status, cell.disabled)}`}>
                      {cell.disabled > 0 && cell.status === 'full'
                        ? `${cell.disabled}🔒 blocked`
                        : `${cell.available}/${cell.total} free`
                      }
                    </div>
                    {cell.booked > 0 && (
                      <div className="text-xs text-blue-500 mt-0.5">{cell.booked} booked</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        ) : (

          /* ── DAY VIEW ── */
          <div>
            {/* Date picker */}
            <div className="flex items-center gap-3 mb-4">
              <input type="date" value={activeDay}
                onChange={e => setActiveDay(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              {dayCell && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(dayCell.status, dayCell.disabled)}`}>
                  {dayCell.available}/{dayCell.total} rooms available
                </span>
              )}
            </div>

            {/* Room toggles */}
            {rooms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                No rooms added yet. Go to <a href="/host/rooms" className="text-green-700 underline">Manage Rooms</a> first.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bulk actions for this day */}
                <div className="flex gap-2 mb-2">
                  <button onClick={() => rooms.forEach(r => {
                    if (isRoomDisabled(r.id, activeDay)) toggleRoom(r.id, activeDay, true);
                  })} className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200">
                    ✓ Enable all rooms this day
                  </button>
                  <button onClick={() => rooms.forEach(r => {
                    if (!isRoomDisabled(r.id, activeDay)) toggleRoom(r.id, activeDay, false);
                  })} className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                    🔒 Disable all rooms this day
                  </button>
                </div>

                {rooms.map(room => {
                  const roomDisabled = isRoomDisabled(room.id, activeDay);
                  return (
                    <div key={room.id}
                      className={`bg-white rounded-xl border p-4 flex items-center justify-between transition-all
                        ${roomDisabled ? 'border-red-100 opacity-60' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
                          ${roomDisabled ? 'bg-red-50' : 'bg-green-50'}`}>
                          🛏️
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{room.name}</p>
                          <p className="text-xs text-gray-400">
                            {room.bedType} · {room.capacity} guests · ₹{room.pricePerNight}/night
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${roomDisabled ? 'text-red-500' : 'text-green-600'}`}>
                          {roomDisabled ? 'Disabled' : 'Enabled'}
                        </span>
                        {/* Toggle switch */}
                        <button
                          onClick={() => toggleRoom(room.id, activeDay, roomDisabled)}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200
                            ${roomDisabled ? 'bg-red-300' : 'bg-green-500'}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                            ${roomDisabled ? 'left-1' : 'left-7'}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Vacation Mode Modal ── */}
      {vacModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">🏖️ Vacation Mode</h2>
            <p className="text-sm text-gray-500 mb-5">
              Block all rooms across a date range. No new bookings can be made during this period.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">From</label>
                  <input type="date" value={vacFrom} onChange={e => setVacFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">To</label>
                  <input type="date" value={vacTo} onChange={e => setVacTo(e.target.value)}
                    min={vacFrom}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Reason (optional)</label>
                <input type="text" value={vacReason} onChange={e => setVacReason(e.target.value)}
                  placeholder="e.g. Maintenance, Personal vacation"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>

              {vacFrom && vacTo && (
                <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
                  This will disable all <strong>{rooms.length} room(s)</strong> from{' '}
                  <strong>{vacFrom}</strong> to <strong>{vacTo}</strong>.
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setVacModal(false)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => applyVacation(true)} disabled={vacBusy || !vacFrom || !vacTo}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40">
                Unblock
              </button>
              <button onClick={() => applyVacation(false)} disabled={vacBusy || !vacFrom || !vacTo}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-medium disabled:opacity-40">
                {vacBusy ? 'Applying…' : 'Block Dates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
