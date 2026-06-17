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
 * Returns how many rooms are manually disabled per day by the host.
 * Only looks at room_availability records with isEnabled=false.
 */
async function getDisabledRoomsPerDay(
  homestayId: string,
  checkIn:    Date,
  checkOut:   Date
): Promise<Map<string, number>> {
  const overrides = await prisma.roomAvailability.findMany({
    where: {
      homestayId,
      isEnabled: false,
      date: { gte: checkIn, lt: checkOut },
    },
    select: { date: true },
  });

  const disabledMap = new Map<string, number>();
  for (const o of overrides) {
    const key = o.date.toISOString().split('T')[0];
    disabledMap.set(key, (disabledMap.get(key) ?? 0) + 1);
  }
  return disabledMap;
}

/**
 * Checks if a booking request can be fulfilled.
 * Accounts for:
 *  - Total rooms in the property
 *  - Rooms manually disabled by the host for specific dates
 *  - Rooms already occupied by pending/confirmed bookings
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
  hostBlockedDates: string[];
}> {
  const [totalRooms, bookedMap, disabledMap] = await Promise.all([
    getTotalRooms(homestayId),
    getBookedRoomsPerDay(homestayId, checkIn, checkOut),
    getDisabledRoomsPerDay(homestayId, checkIn, checkOut),
  ]);

  let minAvailable          = totalRooms;
  const fullyBookedDates:  string[] = [];
  const hostBlockedDates:  string[] = [];

  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    const key      = cursor.toISOString().split('T')[0];
    const booked   = bookedMap.get(key)   ?? 0;
    const disabled = disabledMap.get(key) ?? 0;
    const avail    = totalRooms - booked - disabled;

    if (avail < minAvailable) minAvailable = avail;
    if (avail <= 0) {
      if (disabled > 0 && booked === 0) {
        hostBlockedDates.push(key);  // host blocked, not guest-booked
      } else {
        fullyBookedDates.push(key);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    available:        minAvailable >= roomsRequested,
    minAvailable:     Math.max(0, minAvailable),
    totalRooms,
    fullyBookedDates,
    hostBlockedDates,
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

  const [totalRooms, bookedMap, disabledMap] = await Promise.all([
    getTotalRooms(homestayId),
    getBookedRoomsPerDay(homestayId, checkIn, checkOut),
    getDisabledRoomsPerDay(homestayId, checkIn, checkOut),
  ]);

  const result = [];
  const cursor = new Date(checkIn);

  while (cursor < checkOut) {
    const key      = cursor.toISOString().split('T')[0];
    const booked   = bookedMap.get(key)   ?? 0;
    const disabled = disabledMap.get(key) ?? 0;
    const avail    = totalRooms - booked - disabled;

    result.push({
      date:        key,
      available:   Math.max(0, avail),
      total:       totalRooms,
      booked,
      disabled,
      status:      avail <= 0
        ? 'full'
        : avail <= Math.ceil(totalRooms * 0.3)
          ? 'limited'
          : 'available',
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
