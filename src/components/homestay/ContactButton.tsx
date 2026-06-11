'use client';

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';

interface Props {
  homestayId: string;
  ownerId:    string;
  slug:       string;
}

export default function ContactButton({ homestayId, ownerId, slug }: Props) {
  const router    = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [sent,     setSent]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [phone,    setPhone]    = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem('access_token');
      setLoggedIn(!!token);
    } catch { /* SSR guard */ }
  }, []);

  async function handleContact() {
    if (!loggedIn) {
      router.push(`/login?redirect=/homestays/${slug}`);
      return;
    }

    // For now: reveal a "contact sent" confirmation
    // Later: POST /api/inquiries to notify owner via SMS/email
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate network
    setSent(true);
    setLoading(false);
  }

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
