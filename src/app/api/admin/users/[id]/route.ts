import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// DELETE /api/admin/users/[id] — delete user and all their data
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim() ?? '';
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === payload.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Delete in correct order to avoid FK violations
    await prisma.$transaction(async (tx) => {
      // Get all homestay IDs owned by this user
      const homestays = await tx.homestay.findMany({
        where: { ownerId: id }, select: { id: true },
      });
      const homestayIds = homestays.map(h => h.id);

      if (homestayIds.length > 0) {
        // Delete bookings and reviews on their homestays
        await tx.booking.deleteMany({ where: { homestayId: { in: homestayIds } } });
        await tx.review.deleteMany({ where:   { homestayId: { in: homestayIds } } });
      }

      // Delete their own bookings and reviews as a guest
      await tx.booking.deleteMany({ where: { guestId: id } });
      await tx.review.deleteMany({  where: { userId:  id } });

      // Delete their homestays (rooms/images/categories cascade)
      await tx.homestay.deleteMany({ where: { ownerId: id } });

      // Finally delete the user
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.name ?? user.mobile} and all their data deleted.`,
    });
  } catch (err) {
    console.error('[DELETE /api/admin/users/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] — change role or tier
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim() ?? '';
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const { role, tier } = await req.json();

    const data: any = {};
    if (role && ['guest','host','admin'].includes(role)) data.role = role;
    if (tier && ['free','paid'].includes(tier))          data.tier = tier;

    const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('[PATCH /api/admin/users/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
