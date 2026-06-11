import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyAccessToken(authHeader.split(' ')[1]);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get('status') || 'pending_review';

    const listings = await prisma.homestay.findMany({
      where:   { status: status as any },
      orderBy: { createdAt: 'asc' },
      include: {
        owner: { select: { id: true, name: true, mobile: true, email: true } },
        images: { where: { isCover: true }, take: 1 },
        rooms:  { select: { id: true, name: true, pricePerNight: true, capacity: true, bedType: true, amenities: true } },
        categories: { include: { category: { select: { name: true, group: true } } } },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    const [pendingCount, approvedCount, rejectedCount, totalUsers] = await Promise.all([
      prisma.homestay.count({ where: { status: 'pending_review' } }),
      prisma.homestay.count({ where: { status: 'approved' } }),
      prisma.homestay.count({ where: { status: 'rejected' } }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      listings,
      stats: { pendingCount, approvedCount, rejectedCount, totalUsers },
    });
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[GET /api/admin/listings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
