import { Injectable, NotFoundException } from '@nestjs/common';
import type { Memory } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { requireMembership, requireRole } from '../auth/access.js';
import { CreateMemoryDto } from './dto/create-memory.dto.js';

@Injectable()
export class MemoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /persons/:id/memories — any member of the person's tree may read
  async findAll(userId: number, personId: number): Promise<Memory[]> {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) throw new NotFoundException(`Person ${personId} not found`);
    await requireMembership(this.prisma, userId, person.treeId);
    return this.prisma.memory.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // POST /persons/:id/memories — 403 for VIEWER; authorId is the server's (contract)
  async create(userId: number, personId: number, dto: CreateMemoryDto): Promise<Memory> {
    const person = await this.prisma.person.findUnique({ where: { id: personId } });
    if (!person) throw new NotFoundException(`Person ${personId} not found`);
    await requireRole(this.prisma, userId, person.treeId, 'CONTRIBUTOR');
    return this.prisma.memory.create({
      data: { personId, authorId: userId, content: dto.content },
    });
  }

  // DELETE /memories/:id — 204, but only the author or the tree OWNER (contract)
  async remove(userId: number, id: number): Promise<void> {
    const memory = await this.prisma.memory.findUnique({
      where: { id },
      include: { person: { select: { treeId: true } } },
    });
    if (!memory) throw new NotFoundException(`Memory ${id} not found`);
    if (memory.authorId !== userId) {
      // not the author: only the OWNER of this person's tree may delete it
      await requireRole(this.prisma, userId, memory.person.treeId, 'OWNER');
    } else {
      await requireMembership(this.prisma, userId, memory.person.treeId);
    }
    await this.prisma.memory.delete({ where: { id } });
  }
}
