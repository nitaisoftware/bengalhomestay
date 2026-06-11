'use client';

import Link from 'next/link';
import Image from 'next/image';

interface HomestayCardProps {
  id:            string;
  slug:          string;
  name:          string;
  description?:  string | null;
  district:      string;
  pricePerNight: number;
  minStayDays:   number;
  isFeatured:    boolean;
  isPremium:     boolean;
  coverImage?:   { url: string; altText?: string | null } | null;
  categories:    { name: string; slug: string; group: string }[];
  avgRating?:    number | null;
  reviewCount:   number;
}

export default function HomestayCard({
  slug,
  name,
  description,
  district,
  pricePerNight,
  minStayDays,
  isFeatured,
  isPremium,
  coverImage,
  categories,
  avgRating,
  reviewCount,
}: HomestayCardProps) {
  return (
    <Link
      href={`/homestays/${slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Cover image */}
      <div className="relative h-48 bg-gray-100">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={coverImage.altText ?? name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No photo yet
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {isPremium && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded-full">
              Premium
            </span>
          )}
          {isFeatured && !isPremium && (
            <span className="bg-green-700 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Featured
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-500">{district}</span>
          {categories.slice(0, 2).map((c) => (
            <span key={c.slug} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              {c.name}
            </span>
          ))}
        </div>

        <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 line-clamp-1">
          {name}
        </h3>

        {description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{description}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1">
            {avgRating ? (
              <>
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-sm font-medium text-gray-700">{avgRating}</span>
                <span className="text-xs text-gray-400">({reviewCount})</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-base font-bold text-green-700">
              ₹{pricePerNight.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-gray-400"> / night</span>
            {minStayDays > 1 && (
              <p className="text-xs text-gray-400">min {minStayDays} nights</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
