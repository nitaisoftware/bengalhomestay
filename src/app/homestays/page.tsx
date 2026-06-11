import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchFilters from '@/components/homestay/SearchFilters';
import HomestayCard  from '@/components/homestay/HomestayCard';

export const dynamic = 'force-dynamic'; // SSR — always fresh search results

interface SearchParams {
  district?:  string;
  category?:  string;
  minPrice?:  string;
  maxPrice?:  string;
  amenities?: string;
  minStay?:   string;
  maxStay?:   string;
  page?:      string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const district = searchParams.district ?? 'West Bengal';
  return {
    title:       `Homestays in ${district} | BengalHomestay`,
    description: `Find the best homestays in ${district}. Browse by category, price, and amenities.`,
  };
}

async function fetchHomestays(searchParams: SearchParams) {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const params = new URLSearchParams();

  if (searchParams.district)  params.set('district',  searchParams.district);
  if (searchParams.category)  params.set('category',  searchParams.category);
  if (searchParams.minPrice)  params.set('minPrice',  searchParams.minPrice);
  if (searchParams.maxPrice)  params.set('maxPrice',  searchParams.maxPrice);
  if (searchParams.amenities) params.set('amenities', searchParams.amenities);
  if (searchParams.minStay)   params.set('minStay',   searchParams.minStay);
  if (searchParams.maxStay)   params.set('maxStay',   searchParams.maxStay);
  if (searchParams.page)      params.set('page',      searchParams.page);

  const res = await fetch(`${base}/api/homestays?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) return { data: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } };
  return res.json();
}

export default async function HomestaysPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { data: homestays, pagination } = await fetchHomestays(searchParams);

  const currentPage = Number(searchParams.page ?? 1);
  const heading = searchParams.district
    ? `Homestays in ${searchParams.district}`
    : 'All Homestays in West Bengal';

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{heading}</h1>

      <div className="flex flex-col md:flex-row gap-8">

        {/* Filters sidebar */}
        <div className="md:w-64 shrink-0">
          <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-xl" />}>
            <SearchFilters />
          </Suspense>
        </div>

        {/* Results */}
        <div className="flex-1">
          {/* Result count */}
          <p className="text-sm text-gray-500 mb-4">
            {pagination.total} homestay{pagination.total !== 1 ? 's' : ''} found
          </p>

          {homestays.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-4xl mb-4">🏡</p>
              <p className="text-lg font-medium">No homestays found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {homestays.map((h: any) => (
                <HomestayCard key={h.id} {...h} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/homestays?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border transition-colors ${
                    p === currentPage
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-green-600'
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
