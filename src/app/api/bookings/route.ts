import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// ── POST /api/bookings — guest creates an inquiry ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { homestayId, checkIn, checkOut, guests, message } = await req.json();

    if (!homestayId || !checkIn || !checkOut || !guests) {
      return NextResponse.json({ error: 'homestayId, checkIn, checkOut and guests are required' }, { status: 400 });
    }

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }
    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });
    }

    // Verify homestay exists and is approved
    const homestay = await prisma.homestay.findFirst({
      where: { id: homestayId, status: 'approved' },
      select: { id: true, pricePerNight: true, ownerId: true },
    });
    if (!homestay) return NextResponse.json({ error: 'Homestay not found' }, { status: 404 });

    // Prevent owner from booking their own listing
    if (homestay.ownerId === payload.userId) {
      return NextResponse.json({ error: 'You cannot book your own homestay' }, { status: 400 });
    }

    const nights      = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * homestay.pricePerNight;

    const booking = await prisma.booking.create({
      data: {
        homestayId,
        guestId:     payload.userId,
        checkIn:     checkInDate,
        checkOut:    checkOutDate,
        guests:      Number(guests),
        totalAmount,
        message:     message?.trim() || null,
        status:      'pending',
      },
      include: {
        homestay: { select: { name: true, district: true } },
      },
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/bookings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── GET /api/bookings — list bookings by role ─────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const auth  = req.headers.get('authorization') ?? '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;

    let bookings;

    if (payload.role === 'host' || payload.role === 'admin') {
      // Host: bookings on their properties
      bookings = await prisma.booking.findMany({
        where: {
          homestay:  { ownerId: payload.userId },
          ...(status ? { status: status as any } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          homestay: { select: { id: true, name: true, district: true, slug: true } },
          guest:    { select: { id: true, name: true, mobile: true, email: true } },
        },
      });
    } else {
      // Guest: their own bookings
      bookings = await prisma.booking.findMany({
        where: {
          guestId: payload.userId,
          ...(status ? { status: status as any } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          homestay: { select: { id: true, name: true, district: true, slug: true } },
        },
      });
    }

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error('[GET /api/bookings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
