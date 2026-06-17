import { NextRequest, NextResponse } from 'next/server';
import { prisma }            from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import slugify               from 'slugify';

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyAccessToken(authHeader.split(' ')[1]);
    const ownerId = payload.userId;

    const body = await req.json();
    const {
      name, description, district, address, pincode,
      pricePerNight, minStayDays, maxStayDays,
      amenities, categoryIds, rooms, images,
    } = body;

    // ── Validate ──────────────────────────────────────────────────────────
    if (!name || !district || !pricePerNight) {
      return NextResponse.json({ error: 'Name, district and price are required' }, { status: 400 });
    }

    // ── Generate unique slug ──────────────────────────────────────────────
    const baseSlug = slugify(name, { lower: true, strict: true });
    const count    = await prisma.homestay.count({ where: { slug: { startsWith: baseSlug } } });
    const slug     = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

    // ── Create homestay + rooms in one transaction ────────────────────────
    const homestay = await prisma.$transaction(async (tx) => {
      const h = await tx.homestay.create({
        data: {
          slug,
          name,
          description:   description ?? null,
          district,
          address:       address     ?? null,
          pincode:       pincode     ?? null,
          pricePerNight: Number(pricePerNight),
          minStayDays:   Number(minStayDays) || 1,
          maxStayDays:   Number(maxStayDays) || 30,
          amenities:      amenities  ?? [],
          status:         'pending_review',
          selfRegistered: true,
          ownerId,
          categories: categoryIds?.length
            ? { create: categoryIds.map((categoryId: string) => ({ categoryId })) }
            : undefined,
        },
      });

      // Create rooms if provided
      if (rooms?.length) {
        await tx.room.createMany({
          data: rooms.map((r: any) => ({
            homestayId:    h.id,
            name:          r.name,
            capacity:      Number(r.capacity) || 2,
            bedType:       r.bedType   || null,
            pricePerNight: Number(r.pricePerNight) || Number(pricePerNight),
            amenities:     r.amenities ?? [],
          })),
        });
      }

      // Save uploaded images
      if (images?.length) {
        await tx.homestayImage.createMany({
          data: images.map((img: any, idx: number) => ({
            homestayId: h.id,
            url:        img.url,
            publicId:   img.publicId ?? null,
            isCover:    img.isCover === true || idx === 0,
            sortOrder:  idx,
          })),
        });
      }

      return h;
    });

    return NextResponse.json({ success: true, homestay }, { status: 201 });
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[POST /api/owner/listings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
