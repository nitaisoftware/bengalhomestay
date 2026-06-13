import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// ── PATCH /api/bookings/[id] — host confirms/declines, guest cancels ──────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth   = req.headers.get('authorization') ?? '';
    const token  = auth.replace('Bearer ', '').trim();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { action } = await req.json();
    // allowed actions: confirm | decline | cancel
    const ALLOWED = ['confirm', 'decline', 'cancel'];
    if (!ALLOWED.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { homestay: { select: { ownerId: true } } },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const isOwner = booking.homestay.ownerId === payload.userId;
    const isGuest = booking.guestId           === payload.userId;
    const isAdmin = payload.role              === 'admin';

    // Permission check
    if (action === 'cancel'  && !isGuest && !isAdmin) {
      return NextResponse.json({ error: 'Only the guest can cancel' }, { status: 403 });
    }
    if ((action === 'confirm' || action === 'decline') && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Only the host can confirm or decline' }, { status: 403 });
    }

    const statusMap: Record<string, string> = {
      confirm: 'confirmed',
      decline: 'cancelled',
      cancel:  'cancelled',
    };

    const updated = await prisma.booking.update({
      where: { id },
      data:  { status: statusMap[action] as any },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error('[PATCH /api/bookings/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
