'use client';

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import Link                    from 'next/link';

interface Props {
  homestayId:    string;
  slug:          string;
  pricePerNight: number;
  minStayDays:   number;
  maxStayDays:   number;
  isPremium:     boolean;
  phone:         string | null;
  contactEmail:  string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  checked_in: 'bg-blue-100 text-blue-700',
};

export default function BookingForm({
  homestayId, slug, pricePerNight, minStayDays, maxStayDays, isPremium, phone, contactEmail,
}: Props) {
  const router = useRouter();

  const [loggedIn,   setLoggedIn]   = useState(false);
  const [checkIn,    setCheckIn]    = useState('');
  const [checkOut,   setCheckOut]   = useState('');
  const [guests,     setGuests]     = useState(2);
  const [message,    setMessage]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const [confirmedStatus, setConfirmedStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem('access_token');
      setLoggedIn(!!token);
    } catch { /* SSR guard */ }
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const today    = new Date().toISOString().split('T')[0];
  const nights   = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0;
  const total    = nights > 0 ? nights * pricePerNight : 0;

  // Auto-set checkout when checkin changes
  function handleCheckIn(val: string) {
    setCheckIn(val);
    if (val && (!checkOut || checkOut <= val)) {
      const next = new Date(val);
      next.setDate(next.getDate() + minStayDays);
      setCheckOut(next.toISOString().split('T')[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!loggedIn) {
      // Save full form state so login can auto-submit after verification
      sessionStorage.setItem('pending_inquiry', JSON.stringify({
        homestayId, slug, checkIn, checkOut, guests, message,
      }));
      router.push(`/login?redirect=/homestays/${slug}`);
      return;
    }
    if (!checkIn || !checkOut) { setError('Please select check-in and check-out dates'); return; }
    if (nights < minStayDays)  { setError(`Minimum stay is ${minStayDays} night${minStayDays > 1 ? 's' : ''}`); return; }
    if (nights > maxStayDays)  { setError(`Maximum stay is ${maxStayDays} nights`); return; }

    setLoading(true);
    try {
      const token = sessionStorage.getItem('access_token') ?? '';
      const res   = await fetch('/api/bookings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ homestayId, checkIn, checkOut, guests, message }),
      });
      const data  = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to send inquiry'); return; }

      setSubmitted(true);
      setConfirmedStatus('pending');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── After submission ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center space-y-2">
          <p className="text-3xl">✅</p>
          <p className="text-sm font-semibold text-green-800">Inquiry sent!</p>
          <p className="text-xs text-green-600">
            The host will review your request and confirm. You can track it in{' '}
            <Link href="/my-bookings" className="underline font-medium">My Bookings</Link>.
          </p>
        </div>

        {/* Show contact info for premium after inquiry is sent */}
        {isPremium && (phone || contactEmail) && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Host Directly</p>
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-sm text-green-700 font-medium hover:underline">
                <span>📞</span>{phone}
              </a>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`}
                className="flex items-center gap-3 text-sm text-green-700 font-medium hover:underline truncate">
                <span>✉️</span>{contactEmail}
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Date pickers */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Check-in</label>
          <input
            type="date" value={checkIn} min={today}
            onChange={e => handleCheckIn(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Check-out</label>
          <input
            type="date" value={checkOut} min={checkIn || today}
            onChange={e => setCheckOut(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
      </div>

      {/* Nights summary */}
      {nights > 0 && (
        <div className="bg-green-50 rounded-lg px-3 py-2 flex justify-between items-center text-sm">
          <span className="text-gray-600">{nights} night{nights > 1 ? 's' : ''} × ₹{pricePerNight.toLocaleString('en-IN')}</span>
          <span className="font-bold text-green-700">₹{total.toLocaleString('en-IN')}</span>
        </div>
      )}

      {/* Guests */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Guests</label>
        <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">
          <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-base flex items-center justify-center">−</button>
          <span className="flex-1 text-center text-sm font-medium">{guests} guest{guests > 1 ? 's' : ''}</span>
          <button type="button" onClick={() => setGuests(g => Math.min(20, g + 1))}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-base flex items-center justify-center">+</button>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Message to host <span className="text-gray-400">(optional)</span></label>
        <textarea
          value={message} onChange={e => setMessage(e.target.value)} rows={3}
          placeholder="Tell the host about your trip, special requirements..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
        {loading ? 'Sending…' : loggedIn ? 'Send Inquiry' : 'Sign in to Send Inquiry'}
      </button>

      {!loggedIn && (
        <p className="text-xs text-center text-gray-400">Free to inquire · No booking fees</p>
      )}

      <p className="text-xs text-center text-gray-400">
        Payment will be arranged directly with the host after confirmation.
      </p>
    </form>
  );
}
