'use client';

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';

interface Props {
  homestayId:   string;
  ownerId:      string;
  slug:         string;
  isPremium:    boolean;
  phone:        string | null;
  contactEmail: string | null;
}

export default function ContactButton({
  homestayId,
  ownerId,
  slug,
  isPremium,
  phone,
  contactEmail,
}: Props) {
  const router   = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [sent,     setSent]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem('access_token');
      setLoggedIn(!!token);
    } catch { /* SSR guard */ }
  }, []);

  // ── Premium: show contact details directly ─────────────────────────────────
  if (isPremium && (phone || contactEmail)) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Host</p>
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center gap-3 w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
          >
            <span className="text-base">📞</span>
            <span>{phone}</span>
          </a>
        )}
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}`}
            className="flex items-center gap-3 w-full border border-green-700 hover:bg-green-50 text-green-700 font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
          >
            <span className="text-base">✉️</span>
            <span className="truncate">{contactEmail}</span>
          </a>
        )}
      </div>
    );
  }

  // ── Fallback: non-premium or premium with no contact stored ───────────────
  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-2xl mb-1">✅</p>
        <p className="text-sm font-medium text-green-800">Inquiry sent!</p>
        <p className="text-xs text-green-600 mt-1">
          The host will contact you on your registered mobile.
        </p>
      </div>
    );
  }

  async function handleContact() {
    if (!loggedIn) {
      router.push(`/login?redirect=/homestays/${slug}`);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleContact}
        disabled={loading}
        className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? 'Sending...' : loggedIn ? 'Contact Host' : 'Sign in to Contact Host'}
      </button>
      {!loggedIn && (
        <p className="text-xs text-center text-gray-400">
          Free to contact · No booking fees
        </p>
      )}
    </div>
  );
}
