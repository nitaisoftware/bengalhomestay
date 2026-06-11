import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ── Query params ────────────────────────────────────────────────────────
    const district    = searchParams.get('district') || '';
    const category    = searchParams.get('category') || '';
    const minPrice    = Number(searchParams.get('minPrice'))  || 0;
    const maxPrice    = Number(searchParams.get('maxPrice'))  || 99999;
    const amenities   = searchParams.get('amenities')?.split(',').filter(Boolean) || [];
    const amenity     = searchParams.get('amenity') || '';   // single amenity filter
    const minStay     = Number(searchParams.get('minStay'))   || 1;
    const maxStay     = Number(searchParams.get('maxStay'))   || 30;
    const featured    = searchParams.get('featured') === 'true';
    const sort        = searchParams.get('sort') || 'featured';
    const page        = Math.max(1, Number(searchParams.get('page'))  || 1);
    const limit       = Math.min(50, Number(searchParams.get('limit')) || 12);
    const skip        = (page - 1) * limit;

    // ── Build Prisma where clause ────────────────────────────────────────────
    const where: Prisma.HomestayWhereInput = {
      status: 'approved',
    };

    if (district) {
      where.district = { equals: district, mode: 'insensitive' };
    }

    if (minPrice || maxPrice < 99999) {
      where.pricePerNight = { gte: minPrice, lte: maxPrice };
    }

    if (minStay > 1) {
      where.minStayDays = { lte: minStay };
    }

    if (maxStay < 30) {
      where.maxStayDays = { gte: maxStay };
    }

    const allAmenities = [...amenities, ...(amenity ? [amenity] : [])].filter(Boolean);
    if (allAmenities.length > 0) {
      where.amenities = { hasEvery: allAmenities };
    }

    if (featured) {
      where.isFeatured = true;
    }

    if (category) {
      where.categories = {
        some: {
          category: { slug: category },
        },
      };
    }

    // ── Query ────────────────────────────────────────────────────────────────
    const [total, homestays] = await Promise.all([
      prisma.homestay.count({ where }),
      prisma.homestay.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort === 'price_asc'  ? [{ pricePerNight: 'asc'  }]
              : sort === 'price_desc' ? [{ pricePerNight: 'desc' }]
              : sort === 'newest'     ? [{ createdAt: 'desc' }]
              : /* featured / rating */ [{ isPremium: 'desc' }, { isFeatured: 'desc' }, { createdAt: 'desc' }],
        select: {
          id:            true,
          slug:          true,
          name:          true,
          description:   true,
          district:      true,
          pricePerNight: true,
          minStayDays:   true,
          maxStayDays:   true,
          amenities:     true,
          isFeatured:    true,
          isPremium:     true,
          lat:           true,
          lng:           true,
          images: {
            where:   { isCover: true },
            take:    1,
            select:  { url: true, altText: true },
          },
          categories: {
            select: {
              category: {
                select: { name: true, slug: true, group: true },
              },
            },
          },
          reviews: {
            select: { rating: true },
          },
        },
      }),
    ]);

    // ── Compute avg rating ───────────────────────────────────────────────────
    const results = homestays.map((h) => {
      const ratings = h.reviews.map((r) => r.rating);
      const avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

      return {
        ...h,
        coverImage: h.images[0] ?? null,
        images: h.images.map(i => ({ url: i.url, isCover: true })),
        categories: h.categories,
        avgRating,
        reviewCount: ratings.length,
        reviews: undefined,
      };
    });

    const pages = Math.ceil(total / limit);
    return NextResponse.json({
      homestays: results,
      total,
      page,
      pages,
      // legacy shape kept for backward compat
      data: results,
      pagination: { total, page, limit, totalPages: pages },
    });
  } catch (err) {
    console.error('[GET /api/homestays]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
