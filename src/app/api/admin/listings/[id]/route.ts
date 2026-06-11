import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyAccessToken(authHeader.split(' ')[1]);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, reason } = await req.json();

    if (!['approve', 'reject', 'suspend'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      approve:  'approved',
      reject:   'rejected',
      suspend:  'suspended',
    };

    const homestay = await prisma.homestay.update({
      where: { id: params.id },
      data:  { status: statusMap[action] as any },
    });

    return NextResponse.json({ success: true, homestay });
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[PATCH /api/admin/listings/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
