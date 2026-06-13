DELETE FROM "bookings";
DELETE FROM "reviews";
DELETE FROM "users" WHERE id NOT IN (SELECT DISTINCT "ownerId" FROM "homestays");
