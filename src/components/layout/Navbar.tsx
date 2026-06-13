'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface NavUser {
  id:     string;
  name:   string | null;
  mobile: string | null;
  role:   string;
}

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [user,        setUser]        = useState<NavUser | null>(null);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [invOpen,     setInvOpen]     = useState(false); // inventory sub-dropdown
  const [hydrated,    setHydrated]    = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = sessionStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [pathname]);

  function handleSignOut() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    setUser(null);
    setMenuOpen(false);
    router.push('/');
  }

  function closeAll() { setMenuOpen(false); setInvOpen(false); }

  if (!hydrated) {
    return (
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-xl font-bold text-green-700">BengalHomestay</Link>
        <div className="w-20 h-8" />
      </nav>
    );
  }

  const isHost = user?.role === 'host';

  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold text-green-700">BengalHomestay</Link>

      {/* Desktop */}
      <div className="hidden sm:flex items-center gap-6">
        <Link href="/homestays" className="text-sm text-gray-600 hover:text-green-700 transition-colors">
          Browse Stays
        </Link>

        {!user ? (
          <>
            <Link href="/host/register" className="text-sm text-gray-600 hover:text-green-700 transition-colors">
              List Your Property
            </Link>
            <Link href="/host/login" className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
              Partner
            </Link>
            <Link href="/login" className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-lg transition-colors">
              Login
            </Link>
          </>
        ) : (
          <div className="relative">
            <button onClick={() => { setMenuOpen(!menuOpen); setInvOpen(false); }}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700">
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">
                {(user.name ?? user.mobile ?? '?')[0].toUpperCase()}
              </span>
              <span className="hidden md:block">{user.name ?? user.mobile}</span>
              <span className="text-gray-400">▾</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">

                {/* Common */}
                <Link href="/profile" onClick={closeAll}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Profile
                </Link>
                <Link href="/homestays" onClick={closeAll}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Browse Stays
                </Link>

                {/* Guest */}
                {user.role === 'guest' && (
                  <Link href="/my-bookings" onClick={closeAll}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    My Bookings
                  </Link>
                )}

                {/* Host / Admin — inventory dropdown */}
                {isHost && (
                  <>
                    <Link href="/host/dashboard" onClick={closeAll}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Host Dashboard
                    </Link>

                    {/* ⚙️ Manage Inventory sub-menu */}
                    <div className="relative">
                      <button
                        onClick={() => setInvOpen(!invOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                          <span>🛏️ Manage Rooms</span>
                        <span className="text-gray-400 text-xs">{invOpen ? '▴' : '▾'}</span>
                      </button>

                      {invOpen && (
                        <div className="bg-gray-50 border-t border-b border-gray-100 py-1">
                          <Link href="/host/rooms" onClick={closeAll}
                            className="block pl-8 pr-4 py-2 hover:bg-gray-100">
                            <p className="text-sm text-gray-700 font-medium">➕ Manage Rooms</p>
                            <p className="text-xs text-gray-400 mt-0.5">Add, edit or deactivate rooms</p>
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Admin */}
                {user.role === 'admin' && (
                  <Link href="/admin/dashboard" onClick={closeAll}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Admin Panel
                  </Link>
                )}

                <hr className="my-1 border-gray-100" />
                <button onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile hamburger */}
      <button className="sm:hidden text-gray-600 p-1" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {menuOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-100 shadow-lg sm:hidden z-50 px-4 py-3 space-y-1">
          <Link href="/homestays" onClick={closeAll} className="block text-sm text-gray-700 py-2">Browse Stays</Link>

          {!user ? (
            <>
              <Link href="/host/register" onClick={closeAll} className="block text-sm text-gray-700 py-2">List Your Property</Link>
              <Link href="/host/login"    onClick={closeAll} className="block text-sm text-amber-600 font-medium py-2">Partner Login</Link>
              <Link href="/login"         onClick={closeAll} className="block text-sm bg-green-700 text-white text-center py-2 rounded-lg">Login</Link>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 pb-1 border-b border-gray-50">Signed in as {user.name ?? user.mobile}</p>
              <Link href="/profile"   onClick={closeAll} className="block text-sm text-gray-700 py-2">Profile</Link>
              <Link href="/homestays" onClick={closeAll} className="block text-sm text-gray-700 py-2">Browse Stays</Link>

              {user.role === 'guest' && (
                <Link href="/my-bookings" onClick={closeAll} className="block text-sm text-gray-700 py-2">My Bookings</Link>
              )}

              {isHost && (
                <>
                  <Link href="/host/dashboard" onClick={closeAll} className="block text-sm text-gray-700 py-2">Host Dashboard</Link>

                  {/* Inventory section */}
                  <Link href="/host/rooms" onClick={closeAll} className="block text-sm text-gray-700 py-2">
                    🛏️ Manage Rooms
                  </Link>
                </>
              )}

              {user.role === 'admin' && (
                <Link href="/admin/dashboard" onClick={closeAll} className="block text-sm text-gray-700 py-2">Admin Panel</Link>
              )}

              <button onClick={handleSignOut} className="block text-sm text-red-500 py-2 text-left w-full">Sign out</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
