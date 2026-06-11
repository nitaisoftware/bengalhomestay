import { NextRequest, NextResponse } from 'next/server';
import { redis }   from '@/lib/redis';
import { sendOTP } from '@/lib/msg91';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { mobile } = await req.json();

    // Validate Indian mobile number (10 digits starting with 6-9)
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number' }, { status: 400 });
    }

    // Rate limit: max 3 OTPs per mobile per hour
    const rateKey  = `otp_rate:${mobile}`;
    const attempts = await redis.incr(rateKey);
    if (attempts === 1) await redis.expire(rateKey, 3600);
    if (attempts > 3) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please try again after 1 hour.' },
        { status: 429 }
      );
    }

    const otp = generateOTP();

    // Store OTP in Redis with 5-minute TTL
    await redis.setex(`otp:${mobile}`, 300, otp);

    // In development — skip SMS, return OTP in response for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV OTP] ${mobile} → ${otp}`);
      return NextResponse.json({ success: true, dev_otp: otp });
    }

    const sent = await sendOTP(mobile, otp);
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/auth/otp/send]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
