import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const homestay = await prisma.homestay.findFirst({
      where: {
        slug,
        status: 'approved',
      },
      include: {
        owner: {
          select: { id: true, name: true, avatarUrl: true, createdAt: true },
        },
        images: {
          orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
        },
        rooms: {
          orderBy: { pricePerNight: 'asc' },
        },
        categories: {
          include: { category: { select: { name: true, slug: true, group: true, icon: true } } },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { name: true, avatarUrl: true } } },
        },
        _count: { select: { reviews: true, bookings: true } },
      },
    });

    if (!homestay) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const avgRating =
      homestay.reviews.length > 0
        ? Math.round(
            (homestay.reviews.reduce((sum, r) => sum + r.rating, 0) /
              homestay.reviews.length) * 10
          ) / 10
        : null;

    return NextResponse.json({ ...homestay, avgRating });
  } catch (err) {
    console.error('[GET /api/homestays/:slug]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
