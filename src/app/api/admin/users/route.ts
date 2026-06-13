import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/admin/users — list all users with their stats
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim() ?? '';
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const role   = searchParams.get('role') ?? undefined;
    const search = searchParams.get('search') ?? '';

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: role as any } : {}),
        ...(search ? {
          OR: [
            { name:   { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search } },
            { email:  { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id:        true,
        name:      true,
        mobile:    true,
        email:     true,
        role:      true,
        tier:      true,
        createdAt: true,
        _count: {
          select: { homestays: true, bookings: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error('[GET /api/admin/users]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
