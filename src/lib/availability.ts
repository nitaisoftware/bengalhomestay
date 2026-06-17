import { prisma } from '@/lib/prisma';

/**
 * Returns total room count for a homestay (from rooms table).
 * Falls back to 1 if no rooms are configured.
 */
export async function getTotalRooms(homestayId: string): Promise<number> {
  const count = await prisma.room.count({ where: { homestayId } });
  return count > 0 ? count : 1;
}

/**
 * For each day in [checkIn, checkOut), returns how many rooms are already booked.
 * Only counts pending + confirmed bookings (not cancelled).
 */
export async function getBookedRoomsPerDay(
  homestayId: string,
  checkIn:    Date,
  checkOut:   Date
): Promise<Map<string, number>> {
  // Find all active bookings that overlap with the requested range
  const overlapping = await prisma.booking.findMany({
    where: {
      homestayId,
      status: { in: ['pending', 'confirmed'] },
      checkIn:  { lt: checkOut },
      checkOut: { gt: checkIn },
    },
    select: { checkIn: true, checkOut: true, roomsRequested: true },
  });

  // Build a map: dateString → total rooms booked that day
  const bookedMap = new Map<string, number>();

  for (const booking of overlapping) {
    const cursor = new Date(booking.checkIn);
    while (cursor < booking.checkOut) {
      const key = cursor.toISOString().split('T')[0]; // YYYY-MM-DD
      bookedMap.set(key, (bookedMap.get(key) ?? 0) + booking.roomsRequested);
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return bookedMap;
}

/**
 * Checks if a booking request can be fulfilled.
 * Returns:
 *   available: true/false
 *   minAvailable: minimum available rooms across all requested days
 *   fullyBookedDates: list of dates that are at capacity
 */
export async function checkAvailability(
  homestayId:     string,
  checkIn:        Date,
  checkOut:       Date,
  roomsRequested: number
): Promise<{
  available:        boolean;
  minAvailable:     number;
  totalRooms:       number;
  fullyBookedDates: string[];
}> {
  const totalRooms  = await getTotalRooms(homestayId);
  const bookedMap   = await getBookedRoomsPerDay(homestayId, checkIn, checkOut);

  let minAvailable      = totalRooms;
  const fullyBookedDates: string[] = [];

  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    const key    = cursor.toISOString().split('T')[0];
    const booked = bookedMap.get(key) ?? 0;
    const avail  = totalRooms - booked;

    if (avail < minAvailable) minAvailable = avail;
    if (avail <= 0) fullyBookedDates.push(key);

    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    available:        minAvailable >= roomsRequested,
    minAvailable:     Math.max(0, minAvailable),
    totalRooms,
    fullyBookedDates,
  };
}

/**
 * Returns daily availability for a whole month (for calendar display).
 * Pass the first and last day of the month as checkIn/checkOut.
 */
export async function getMonthlyAvailability(
  homestayId: string,
  year:       number,
  month:      number  // 0-indexed (JS Date convention)
): Promise<Array<{ date: string; available: number; total: number; status: 'available' | 'limited' | 'full' }>> {
  const checkIn  = new Date(year, month, 1);
  const checkOut = new Date(year, month + 1, 1);

  const totalRooms = await getTotalRooms(homestayId);
  const bookedMap  = await getBookedRoomsPerDay(homestayId, checkIn, checkOut);

  const result = [];
  const cursor = new Date(checkIn);

  while (cursor < checkOut) {
    const key    = cursor.toISOString().split('T')[0];
    const booked = bookedMap.get(key) ?? 0;
    const avail  = totalRooms - booked;

    result.push({
      date:      key,
      available: Math.max(0, avail),
      total:     totalRooms,
      status:    avail <= 0
        ? 'full'
        : avail <= Math.ceil(totalRooms * 0.3)
          ? 'limited'
          : 'available',
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
