import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Discover Homestays Across West Bengal
        </h1>
        <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
          From Darjeeling hills to Sundarbans delta — find authentic, local homestays hand-picked across every district.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/homestays"
            className="bg-white text-green-700 font-semibold px-8 py-3 rounded-xl hover:bg-green-50 transition-colors"
          >
            Browse Homestays
          </Link>
          <Link
            href="/host/register"
            className="border border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            List Your Property
          </Link>
        </div>
      </section>

      {/* Districts */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Popular Districts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { name: 'Darjeeling',        emoji: '⛰️' },
            { name: 'Kalimpong',         emoji: '🏡' },
            { name: 'Sundarbans',        emoji: '🌿' },
            { name: 'Murshidabad',       emoji: '🏛️' },
            { name: 'Birbhum',           emoji: '🎨' },
            { name: 'Purulia',           emoji: '🌄' },
            { name: 'South 24 Parganas', emoji: '🚤' },
            { name: 'Jalpaiguri',        emoji: '🌳' },
          ].map((d) => (
            <Link
              key={d.name}
              href={`/homestays?district=${encodeURIComponent(d.name)}`}
              className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-green-400 hover:shadow-sm transition-all text-sm font-medium text-gray-700"
            >
              <span className="text-xl">{d.emoji}</span>
              {d.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Browse by Experience</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Hills & Mountains', slug: 'hills-mountains',    emoji: '🏔️' },
              { label: 'Jungle & Wildlife', slug: 'wildlife-sanctuaries', emoji: '🐯' },
              { label: 'Rivers & Lakes',    slug: 'rivers-lakes',       emoji: '🌊' },
              { label: 'Heritage',          slug: 'monuments',          emoji: '🏛️' },
              { label: 'Eco Tourism',       slug: 'eco-tourism',        emoji: '🌱' },
              { label: 'Adventure',         slug: 'hiking-trekking',    emoji: '🥾' },
            ].map((c) => (
              <Link
                key={c.slug}
                href={`/homestays?category=${c.slug}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-400 hover:shadow-sm transition-all text-center"
              >
                <p className="text-3xl mb-2">{c.emoji}</p>
                <p className="text-sm font-medium text-gray-700">{c.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Own a Homestay?</h2>
        <p className="text-gray-500 mb-6">List your property for free and reach thousands of travellers across India.</p>
        <Link
          href="/host/register"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Get Started — It&apos;s Free
        </Link>
      </section>
    </main>
  );
}
