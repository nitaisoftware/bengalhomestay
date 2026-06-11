import { NextRequest, NextResponse } from 'next/server';
import { prisma }              from '@/lib/prisma';
import { verifyAccessToken }   from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    const ownerId = payload.userId;

    // ── Date helpers ──────────────────────────────────────────────────────
    const now       = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Queries ───────────────────────────────────────────────────────────
    const [
      totalListings,
      approvedListings,
      pendingListings,
      totalBookings,
      todayBookings,
      monthRevenue,
      recentBookings,
      myListings,
    ] = await Promise.all([
      prisma.homestay.count({ where: { ownerId } }),
      prisma.homestay.count({ where: { ownerId, status: 'approved' } }),
      prisma.homestay.count({ where: { ownerId, status: 'pending_review' } }),
      prisma.booking.count({
        where: { homestay: { ownerId } },
      }),
      prisma.booking.count({
        where: {
          homestay:  { ownerId },
          createdAt: { gte: todayStart },
        },
      }),
      prisma.booking.aggregate({
        where: {
          homestay:  { ownerId },
          status:    { in: ['confirmed', 'checked_in', 'checked_out'] },
          createdAt: { gte: monthStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where:   { homestay: { ownerId } },
        orderBy: { createdAt: 'desc' },
        take:    5,
        select: {
          id:          true,
          checkIn:     true,
          checkOut:    true,
          guests:      true,
          totalAmount: true,
          status:      true,
          guest: { select: { name: true, mobile: true } },
          homestay: { select: { name: true } },
        },
      }),
      prisma.homestay.findMany({
        where:   { ownerId },
        orderBy: { createdAt: 'desc' },
        select: {
          id:            true,
          slug:          true,
          name:          true,
          status:        true,
          district:      true,
          pricePerNight: true,
          isFeatured:    true,
          isPremium:     true,
          images: {
            where:  { isCover: true },
            take:   1,
            select: { url: true },
          },
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalListings,
        approvedListings,
        pendingListings,
        totalBookings,
        todayBookings,
        monthRevenue: monthRevenue._sum.totalAmount ?? 0,
      },
      recentBookings,
      myListings,
    });
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[GET /api/owner/dashboard]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
