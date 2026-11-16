# Week 7 — Explain it

Answers based on `week07/campus-events-api-week07/src` (`prisma/schema.prisma`, `events.service.ts`, `bookings.service.ts`) and the `init` migration.

## 1. Why does Booking have an eventId column but Event has no bookingIds column? Where is the "many" side of a 1-N relation stored?

A 1-N relation is stored on the "many" side, because one row of the many side points at exactly one row of the one side, while the one side is pointed at by many rows. `Booking` therefore gets `eventId Int` plus the foreign key `event Event @relation(fields: [eventId], ...)`; putting many ids on `Event` would mean an unbounded list column that SQL cannot index or cascade. The reverse direction exists only in Prisma (`bookings Booking[]` in `Event`), which is not a column but a navigation hint: Prisma resolves it as a `WHERE "eventId" = $1` query, and `@@index([eventId])` makes that lookup fast.

## 2. `booked` repeats information we could compute with COUNT and SUM over bookings. Why keep it, and what must the code do so it never becomes wrong?

`booked` is a denormalised counter: reading it costs one column of one row, whereas computing it needs `COUNT(*)`/`SUM(seats)` over the bookings table with an index scan — on a list of 20 events that is 20 extra queries on every page load. The price of that speed is that the copy can drift, so every write that changes seats must update it in the same transaction as the booking itself: `bookings.service.ts` increments it in the conditional `updateMany` when a booking is created and decrements it when a booking is deleted, both inside `$transaction`, so the counter and the booking rows commit or roll back together and `booked` can never disagree with the bookings.

## 3. What is the difference between `prisma migrate dev` and `prisma generate`? Which one changes the database?

`prisma migrate dev` is the database-side command: it compares `schema.prisma` with the migrations folder, writes the SQL file under `prisma/migrations/*_init/migration.sql`, runs it against PostgreSQL and (in dev) refreshes the seed — it is the only one of the two that changes tables. `prisma generate` is client-side only: it reads the same schema and rebuilds the typed client in `src/generated/prisma`, so `prisma.booking.create(...)` and its types exist in TypeScript. It never touches the database, which is why after editing a model you run both — `migrate dev` for the tables, `generate` for the code.

## 4. A page lists 20 events with their bookings. One version runs 1 query, another runs 21. Name the problem and show how `include` fixes it.

The problem is the N+1 query problem: one query for the list, then one extra query per event to fetch its bookings (`findMany` + 20 × `findMany`), so the number of round trips to PostgreSQL grows with the number of rows. `include` fixes it by making Prisma issue a single request — it adds a join (or a second query keyed by all 20 ids at once) and returns `event.bookings` nested inside each event:

```ts
const events = await prisma.event.findMany({ include: { bookings: true } });
```

20 events with their bookings then cost 1 query instead of 21.

## 5. Two students book the last seat at the same moment. Explain step by step why the read-check-update version can sell two seats and why the conditional `updateMany` cannot.

Read-check-update interleaves because each `await` releases the row: both transactions read `booked = 29`, `capacity = 30` at the same time, both compute `30 - 29 = 1 >= 1` in JavaScript, both see "it fits", and then each runs `UPDATE booked = 30` — the second write silently overwrites the first, so two bookings exist while only one seat did, and both students get a confirmation. The conditional `updateMany` moves the check into the statement itself: `WHERE id = $1 AND booked <= capacity - seats` is evaluated by PostgreSQL against the current row while it holds the row lock, so only one of the two concurrent updates can match and change the row. The second transaction's update runs after the first commits, now finds `booked = 30` which no longer satisfies `booked <= 30 - 1`, matches `count = 0` rows, and the service throws `ConflictException("Only 0 seat(s) left")` — exactly the behaviour the last e2e test asserts (10 concurrent requests for the last 3 seats, exactly 3 succeed).
