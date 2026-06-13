import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

async function verifyRoomOwnership(roomId: string, userId: string) {
  return prisma.room.findFirst({
    where: { id: roomId, homestay: { ownerId: userId } },
  });
}

// PATCH /api/owner/rooms/[id] — update room details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token   = req.headers.get('authorization')?.replace('Bearer ', '').trim() ?? '';
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const room    = await verifyRoomOwnership(id, payload.userId);
    if (!room) return NextResponse.json({ error: 'Room not found or not yours' }, { status: 404 });

    const { name, description, capacity, bedType, pricePerNight, amenities } = await req.json();

    const data: Record<string, any> = {};
    if (name          !== undefined) data.name          = name.trim();
    if (description   !== undefined) data.description   = description?.trim() || null;
    if (capacity      !== undefined) data.capacity      = Number(capacity);
    if (bedType       !== undefined) data.bedType       = bedType || null;
    if (pricePerNight !== undefined) data.pricePerNight = Number(pricePerNight);
    if (amenities     !== undefined) data.amenities     = amenities;

    const updated = await prisma.room.update({ where: { id }, data });
    return NextResponse.json({ success: true, room: updated });
  } catch (err) {
    console.error('[PATCH /api/owner/rooms/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/owner/rooms/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token   = req.headers.get('authorization')?.replace('Bearer ', '').trim() ?? '';
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const room    = await verifyRoomOwnership(id, payload.userId);
    if (!room) return NextResponse.json({ error: 'Room not found or not yours' }, { status: 404 });

    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/owner/rooms/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
