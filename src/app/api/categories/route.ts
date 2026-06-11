import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const slugs = req.nextUrl.searchParams.get('slugs')?.split(',').filter(Boolean) ?? [];

    if (slugs.length === 0) {
      const all = await prisma.category.findMany({ orderBy: { group: 'asc' } });
      return NextResponse.json(all);
    }

    const cats = await prisma.category.findMany({ where: { slug: { in: slugs } } });
    return NextResponse.json({ ids: cats.map((c) => c.id) });
  } catch (err) {
    console.error('[GET /api/categories]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
