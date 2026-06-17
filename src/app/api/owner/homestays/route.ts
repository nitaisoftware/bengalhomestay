import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/owner/homestays — list all homestays owned by the logged-in host
export async function GET(req: NextRequest) {
  try {
    const auth    = req.headers.get('authorization') ?? '';
    const token   = auth.replace('Bearer ', '').trim();
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const homestays = await prisma.homestay.findMany({
      where:   { ownerId: payload.userId },
      orderBy: { createdAt: 'asc' },
      select:  { id: true, name: true, status: true, district: true },
    });

    return NextResponse.json({ homestays });
  } catch (err) {
    console.error('[GET /api/owner/homestays]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
