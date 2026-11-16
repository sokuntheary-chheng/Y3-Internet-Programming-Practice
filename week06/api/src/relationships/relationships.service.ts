import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Relationship } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { requireMembership, requireRole } from '../auth/access.js';
import { CreateRelationshipDto } from './dto/create-relationship.dto.js';

@Injectable()
export class RelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /trees/:id/relationships — any member may read
  async findAll(userId: number, treeId: number): Promise<Relationship[]> {
    await requireMembership(this.prisma, userId, treeId);
    return this.prisma.relationship.findMany({
      where: { treeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // POST /trees/:id/relationships — reading both persons, checking they are
  // in this tree and writing the row happen in ONE transaction, so no person
  // can be moved or deleted between the check and the insert.
  async create(
    userId: number,
    treeId: number,
    dto: CreateRelationshipDto,
  ): Promise<Relationship> {
    await requireRole(this.prisma, userId, treeId, 'CONTRIBUTOR');
    if (dto.personId === dto.relatedPersonId)
      // 400: a person cannot be related to itself (contract)
      throw new BadRequestException('personId must differ from relatedPersonId');

    return this.prisma.$transaction(async (tx) => {
      const [a, b] = await Promise.all([
        tx.person.findUnique({ where: { id: dto.personId } }),
        tx.person.findUnique({ where: { id: dto.relatedPersonId } }),
      ]);
      // 404 person not in this tree (contract) — covers unknown ids too
      if (!a || a.treeId !== treeId)
        throw new NotFoundException(`Person ${dto.personId} not in tree ${treeId}`);
      if (!b || b.treeId !== treeId)
        throw new NotFoundException(`Person ${dto.relatedPersonId} not in tree ${treeId}`);

      try {
        return await tx.relationship.create({
          data: {
            treeId,
            personId: dto.personId,
            relatedPersonId: dto.relatedPersonId,
            type: dto.type as 'parent' | 'spouse' | 'sibling',
          },
        });
      } catch {
        // The @@unique([treeId, personId, relatedPersonId, type]) index in the
        // schema rejects the second identical row: 409 duplicate (contract).
        throw new ConflictException('This relationship already exists');
      }
    });
  }

  // DELETE /relationships/:id — 204
  async remove(userId: number, id: number): Promise<void> {
    const rel = await this.prisma.relationship.findUnique({ where: { id } });
    if (!rel) throw new NotFoundException(`Relationship ${id} not found`);
    await requireRole(this.prisma, userId, rel.treeId, 'CONTRIBUTOR');
    await this.prisma.relationship.delete({ where: { id } });
  }
}
