import { NextRequest, NextResponse } from 'next/server';
import { redis }                          from '@/lib/redis';
import { prisma }                         from '@/lib/prisma';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { mobile, otp, name, role = 'host' } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json({ error: 'Mobile and OTP are required' }, { status: 400 });
    }

    // Verify OTP from Redis
    const stored = await redis.get(`otp:${mobile}`);
    if (!stored || String(stored) !== String(otp)) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Delete OTP so it can't be reused
    await redis.del(`otp:${mobile}`);

    // Get or create user
    let user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          mobile,
          name:  name ?? null,
          role:  role === 'host' ? 'host' : 'guest',
        },
      });
    }

    // Issue tokens
    const accessToken  = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken(user.id);

    // Store refresh token in Redis (7 days)
    await redis.setex(`otp:refresh:${user.id}`, 60 * 60 * 24 * 7, refreshToken);

    const response = NextResponse.json({
      success: true,
      user: {
        id:     user.id,
        name:   user.name,
        mobile: user.mobile,
        role:   user.role,
        tier:   user.tier,
      },
      accessToken,
    });

    // Refresh token as httpOnly cookie
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7,
      path:     '/',
    });

    return response;
  } catch (err) {
    console.error('[POST /api/auth/otp/verify]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
