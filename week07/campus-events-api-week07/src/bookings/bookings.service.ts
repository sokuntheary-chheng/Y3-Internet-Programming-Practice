import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Booking } from '../generated/prisma/client.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) { }

  findAll(): Promise<Booking[]> {
    return this.prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
  }

  // C1: booking is created in ONE transaction (this.prisma.$transaction(async (tx) => { ... })):
  //  - 404 if the event does not exist
  //  - add dto.seats to event.booked ONLY IF they fit, using tx.event.updateMany with a
  //    condition in where; if no row was updated, throw ConflictException(`Only ${left} seat(s) left`)
  //  - create and return the booking
  // Read first, check in JavaScript, then update is NOT enough: see the last e2e test.
  create(eventId: number, dto: CreateBookingDto): Promise<Booking> {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException(`Event ${eventId} not found`);
      const { count } = await tx.event.updateMany({
        where: { id: eventId, booked: { lte: event.capacity - dto.seats } },
        data: { booked: { increment: dto.seats } },
      });
      if (count === 0)
        throw new ConflictException(`Only ${event.capacity - event.booked} seat(s) left`);
      return tx.booking.create({ data: { eventId, ...dto } });
    });
  }

  // C2: 404 if the booking does not exist; delete it AND give its seats
  // back to the event, both in one transaction (the array form of $transaction is enough)
  async remove(id: number): Promise<void> {
    const b = await this.prisma.booking.findUnique({ where: { id } });
    if (!b) throw new NotFoundException(`Booking ${id} not found`);
    await this.prisma.$transaction([
      this.prisma.booking.delete({ where: { id } }),
      this.prisma.event.update({
        where: { id: b.eventId },
        data: { booked: { decrement: b.seats } },
      }),
    ]);
  }
}
