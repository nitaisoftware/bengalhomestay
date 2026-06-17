CREATE TABLE IF NOT EXISTS "room_availability" (
  "id"         TEXT NOT NULL,
  "roomId"     TEXT NOT NULL,
  "homestayId" TEXT NOT NULL,
  "date"       DATE NOT NULL,
  "isEnabled"  BOOLEAN NOT NULL DEFAULT false,
  "reason"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "room_availability_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "room_availability_roomId_date_key" UNIQUE ("roomId", "date"),
  CONSTRAINT "room_availability_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "room_availability_homestayId_fkey"
    FOREIGN KEY ("homestayId") REFERENCES "homestays"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "room_availability_homestayId_date_idx"
  ON "room_availability"("homestayId", "date");
