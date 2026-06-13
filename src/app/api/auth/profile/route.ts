import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/prisma';
import { verifyAccessToken }         from '@/lib/auth';

const PROFILE_SELECT = {
  id: true, name: true, email: true, mobile: true,
  role: true, tier: true, avatarUrl: true,
  gender: true, dob: true,
  address: true, city: true, district: true, state: true, pincode: true,
  onboardingComplete: true, createdAt: true,
};

// GET /api/auth/profile
export async function GET(req: NextRequest) {
  try {
    const token   = req.headers.get('authorization')?.replace('Bearer ', '').trim() ?? '';
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where:  { id: payload.userId },
      select: PROFILE_SELECT,
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[GET /api/auth/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/auth/profile
export async function PATCH(req: NextRequest) {
  try {
    const token   = req.headers.get('authorization')?.replace('Bearer ', '').trim() ?? '';
    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      name, email, gender, dob,
      address, city, district, state, pincode,
      onboardingComplete,
    } = body;

    const data: Record<string, any> = {};
    if (name  !== undefined && name.trim().length > 0)                        data.name    = name.trim();
    if (email !== undefined && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))  data.email   = email.trim();
    if (gender  !== undefined) data.gender  = gender  || null;
    if (dob     !== undefined) data.dob     = dob ? new Date(dob) : null;
    if (address !== undefined) data.address = address || null;
    if (city    !== undefined) data.city    = city    || null;
    if (district!== undefined) data.district= district|| null;
    if (state   !== undefined) data.state   = state   || null;
    if (pincode !== undefined) data.pincode = pincode || null;
    if (onboardingComplete === true) data.onboardingComplete = true;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Nothing to update' });
    }

    const user = await prisma.user.update({
      where:  { id: payload.userId },
      data,
      select: PROFILE_SELECT,
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('[PATCH /api/auth/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
