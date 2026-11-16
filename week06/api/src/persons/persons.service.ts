import { Injectable, NotFoundException } from '@nestjs/common';
import type { Person } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { requireMembership, requireRole } from '../auth/access.js';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto.js';

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /trees/:id/persons — any member may read (VIEWER included)
  async findAll(userId: number, treeId: number): Promise<Person[]> {
    await requireMembership(this.prisma, userId, treeId);
    return this.prisma.person.findMany({
      where: { treeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Loads the person (404) and returns its treeId so the caller can apply
  // the role rule on the right tree. Used by every /persons/:id route.
  private async inTree(userId: number, id: number): Promise<Person> {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    await requireMembership(this.prisma, userId, person.treeId);
    return person;
  }

  // GET /persons/:id — membership of the person's tree is enough
  async findOne(userId: number, id: number): Promise<Person> {
    return this.inTree(userId, id);
  }

  // POST /trees/:id/persons — 403 for VIEWER (CONTRIBUTOR required)
  async create(userId: number, treeId: number, dto: CreatePersonDto): Promise<Person> {
    await requireRole(this.prisma, userId, treeId, 'CONTRIBUTOR');
    return this.prisma.person.create({
      data: {
        treeId,
        name: dto.name,
        gender: dto.gender as 'male' | 'female' | 'other' | undefined,
        // @IsDateString accepts a plain date (1990-01-01); Prisma's DateTime
        // wants a full ISO timestamp, so wrap it in a Date.
        birthDate: dto.birthDate && new Date(dto.birthDate),
        deathDate: dto.deathDate && new Date(dto.deathDate),
        biography: dto.biography ?? '',
      },
    });
  }

  // PATCH /persons/:id — only the fields that were sent, 403 for VIEWER
  async update(userId: number, id: number, dto: UpdatePersonDto): Promise<Person> {
    const person = await this.inTree(userId, id);
    await requireRole(this.prisma, userId, person.treeId, 'CONTRIBUTOR');
    return this.prisma.person.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.gender !== undefined && { gender: dto.gender as 'male' | 'female' | 'other' }),
        ...(dto.birthDate !== undefined && { birthDate: new Date(dto.birthDate) }),
        ...(dto.deathDate !== undefined && { deathDate: new Date(dto.deathDate) }),
        ...(dto.biography !== undefined && { biography: dto.biography }),
      },
    });
  }

  // DELETE /persons/:id — 204. Relationships and memories go with it
  // (onDelete: Cascade in the schema, contract: "its relationships and memories removed").
  async remove(userId: number, id: number): Promise<void> {
    const person = await this.inTree(userId, id);
    await requireRole(this.prisma, userId, person.treeId, 'CONTRIBUTOR');
    await this.prisma.person.delete({ where: { id } });
  }
}
