import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability, getMonthlyAvailability } from '@/lib/availability';

/**
 * GET /api/homestays/availability
 *
 * Query params:
 *   homestayId  (required)
 *   checkIn     (YYYY-MM-DD) — for a specific range check
 *   checkOut    (YYYY-MM-DD) — for a specific range check
 *   rooms       (number, default 1) — how many rooms guest wants
 *   year        (number) — for monthly calendar view
 *   month       (number, 0-indexed) — for monthly calendar view
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const homestayId = searchParams.get('homestayId');

    if (!homestayId) {
      return NextResponse.json({ error: 'homestayId is required' }, { status: 400 });
    }

    // Monthly calendar view
    const yearParam  = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (yearParam && monthParam) {
      const data = await getMonthlyAvailability(
        homestayId,
        parseInt(yearParam),
        parseInt(monthParam)
      );
      return NextResponse.json({ availability: data });
    }

    // Specific range check
    const checkInStr  = searchParams.get('checkIn');
    const checkOutStr = searchParams.get('checkOut');
    const rooms       = parseInt(searchParams.get('rooms') ?? '1');

    if (!checkInStr || !checkOutStr) {
      return NextResponse.json({ error: 'checkIn and checkOut are required' }, { status: 400 });
    }

    const checkIn  = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }

    const result = await checkAvailability(homestayId, checkIn, checkOut, rooms);
    return NextResponse.json(result);

  } catch (err) {
    console.error('[GET /api/homestays/availability]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
