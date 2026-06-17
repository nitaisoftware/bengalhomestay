import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// ── GET /api/owner/availability?homestayId=X&year=Y&month=M ──────────────────
// Returns all rooms + their disabled dates for the given month
export async function GET(req: NextRequest) {
  try {
    const auth    = req.headers.get('authorization') ?? '';
    const token   = auth.replace('Bearer ', '').trim();
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const homestayId = searchParams.get('homestayId');
    const year       = parseInt(searchParams.get('year')  ?? `${new Date().getFullYear()}`);
    const month      = parseInt(searchParams.get('month') ?? `${new Date().getMonth()}`);

    if (!homestayId) return NextResponse.json({ error: 'homestayId required' }, { status: 400 });

    // Verify ownership — only self-registered homestays
    const homestay = await prisma.homestay.findFirst({
      where: { id: homestayId, ownerId: payload.userId, selfRegistered: true },
    });
    if (!homestay) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const from = new Date(year, month, 1);
    const to   = new Date(year, month + 1, 1);

    const [rooms, overrides] = await Promise.all([
      prisma.room.findMany({
        where:   { homestayId },
        orderBy: { name: 'asc' },
        select:  { id: true, name: true, bedType: true, capacity: true, pricePerNight: true },
      }),
      prisma.roomAvailability.findMany({
        where: {
          homestayId,
          date: { gte: from, lt: to },
        },
        select: { roomId: true, date: true, isEnabled: true, reason: true },
      }),
    ]);

    // Build disabled dates per room: { roomId: ['2026-08-15', ...] }
    const disabledByRoom: Record<string, string[]> = {};
    for (const o of overrides) {
      if (!o.isEnabled) {
        if (!disabledByRoom[o.roomId]) disabledByRoom[o.roomId] = [];
        disabledByRoom[o.roomId].push(o.date.toISOString().split('T')[0]);
      }
    }

    return NextResponse.json({ rooms, disabledByRoom, totalRooms: rooms.length });
  } catch (err) {
    console.error('[GET /api/owner/availability]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/owner/availability — toggle single room on single date ──────────
export async function POST(req: NextRequest) {
  try {
    const auth    = req.headers.get('authorization') ?? '';
    const token   = auth.replace('Bearer ', '').trim();
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId, date, isEnabled, reason } = await req.json();
    if (!roomId || !date) return NextResponse.json({ error: 'roomId and date required' }, { status: 400 });

    // Verify ownership via room → homestay
    const room = await prisma.room.findFirst({
      where:  { id: roomId, homestay: { ownerId: payload.userId } },
      select: { id: true, homestayId: true },
    });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const dateObj = new Date(date);

    if (isEnabled) {
      // Re-enabling: delete the override record
      await prisma.roomAvailability.deleteMany({
        where: { roomId, date: dateObj },
      });
    } else {
      // Disabling: upsert override
      await prisma.roomAvailability.upsert({
        where:  { roomId_date: { roomId, date: dateObj } },
        update: { isEnabled: false, reason: reason ?? null },
        create: {
          roomId,
          homestayId: room.homestayId,
          date:       dateObj,
          isEnabled:  false,
          reason:     reason ?? null,
        },
      });
    }

    return NextResponse.json({ success: true, roomId, date, isEnabled });
  } catch (err) {
    console.error('[POST /api/owner/availability]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/owner/availability — vacation mode: block all rooms for range ─
export async function DELETE(req: NextRequest) {
  try {
    const auth    = req.headers.get('authorization') ?? '';
    const token   = auth.replace('Bearer ', '').trim();
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { homestayId, from, to, reason, unblock } = await req.json();
    if (!homestayId || !from || !to) {
      return NextResponse.json({ error: 'homestayId, from, to required' }, { status: 400 });
    }

    // Verify ownership — only self-registered homestays
    const homestay = await prisma.homestay.findFirst({
      where:  { id: homestayId, ownerId: payload.userId, selfRegistered: true },
      select: { id: true },
    });
    if (!homestay) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const rooms = await prisma.room.findMany({
      where:  { homestayId },
      select: { id: true },
    });

    const fromDate = new Date(from);
    const toDate   = new Date(to);

    if (unblock) {
      // UNBLOCK: remove all override records in range
      await prisma.roomAvailability.deleteMany({
        where: {
          homestayId,
          date: { gte: fromDate, lte: toDate },
        },
      });
      return NextResponse.json({ success: true, unblocked: true });
    }

    // BLOCK: create override records for every room × every date in range
    const records = [];
    for (const room of rooms) {
      const cursor = new Date(fromDate);
      while (cursor <= toDate) {
        records.push({
          id:         `${room.id}_${cursor.toISOString().split('T')[0]}`,
          roomId:     room.id,
          homestayId,
          date:       new Date(cursor),
          isEnabled:  false,
          reason:     reason ?? 'Vacation mode',
          updatedAt:  new Date(),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    await prisma.roomAvailability.createMany({
      data:           records,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      blocked: records.length,
      rooms:   rooms.length,
    });
  } catch (err) {
    console.error('[DELETE /api/owner/availability]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
