import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/owner/rooms — all homestays + their rooms for the logged-in host
export async function GET(req: NextRequest) {
  try {
    const token   = req.headers.get('authorization')?.replace('Bearer ', '').trim() ?? '';
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const homestays = await prisma.homestay.findMany({
      where:   { ownerId: payload.userId, selfRegistered: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id:       true,
        name:     true,
        district: true,
        status:   true,
        rooms: {
          orderBy: { createdAt: 'asc' },
          select: {
            id:            true,
            name:          true,
            description:   true,
            capacity:      true,
            bedType:       true,
            pricePerNight: true,
            amenities:     true,
            createdAt:     true,
          },
        },
      },
    });

    return NextResponse.json({ homestays });
  } catch (err) {
    console.error('[GET /api/owner/rooms]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/owner/rooms — add a new room to a homestay
export async function POST(req: NextRequest) {
  try {
    const token   = req.headers.get('authorization')?.replace('Bearer ', '').trim() ?? '';
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { homestayId, name, description, capacity, bedType, pricePerNight, amenities } = await req.json();

    if (!homestayId || !name || !capacity || !pricePerNight) {
      return NextResponse.json({ error: 'homestayId, name, capacity and pricePerNight are required' }, { status: 400 });
    }

    // Verify ownership
    const homestay = await prisma.homestay.findFirst({ where: { id: homestayId, ownerId: payload.userId } });
    if (!homestay) return NextResponse.json({ error: 'Homestay not found or not yours' }, { status: 404 });

    const room = await prisma.room.create({
      data: {
        homestayId,
        name:          name.trim(),
        description:   description?.trim() || null,
        capacity:      Number(capacity),
        bedType:       bedType || null,
        pricePerNight: Number(pricePerNight),
        amenities:     amenities ?? [],
      },
    });

    return NextResponse.json({ success: true, room }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/owner/rooms]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
