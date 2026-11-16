import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Tree } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { requireMembership, requireRole } from '../auth/access.js';
import { CreateTreeDto } from './dto/create-tree.dto.js';
import { UpdateTreeDto } from './dto/update-tree.dto.js';

@Injectable()
export class TreesService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /trees — only the trees the caller belongs to (contract)
  findAll(userId: number): Promise<Tree[]> {
    return this.prisma.tree.findMany({
      where: { memberships: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  // GET /trees/:id — 404 if missing, 403 if the caller is not a member
  async findOne(userId: number, id: number): Promise<Tree> {
    const tree = await this.prisma.tree.findUnique({ where: { id } });
    if (!tree) throw new NotFoundException(`Tree ${id} not found`);
    await requireMembership(this.prisma, userId, id);
    return tree;
  }

  // POST /trees — the tree AND the OWNER membership of the caller are written
  // in ONE transaction: either both rows exist or neither does.
  create(userId: number, dto: CreateTreeDto): Promise<Tree> {
    return this.prisma.$transaction(async (tx) => {
      const tree = await tx.tree.create({
        data: {
          name: dto.name,
          description: dto.description ?? '',
          ownerId: userId, // the server decides the owner (contract)
        },
      });
      await tx.membership.create({
        data: { userId, treeId: tree.id, role: 'OWNER' },
      });
      return tree;
    });
  }

  // PATCH /trees/:id — 403 unless the caller is OWNER of this tree
  async update(userId: number, id: number, dto: UpdateTreeDto): Promise<Tree> {
    await requireRole(this.prisma, userId, id, 'OWNER');
    return this.prisma.tree.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  // DELETE /trees/:id — 204. Persons, memberships, relationships and memories
  // go with it: every child row has onDelete: Cascade in the schema.
  async remove(userId: number, id: number): Promise<void> {
    await requireRole(this.prisma, userId, id, 'OWNER');
    await this.prisma.tree.delete({ where: { id } });
  }

  // GET /trees/:id/members
  async members(userId: number, treeId: number) {
    await requireMembership(this.prisma, userId, treeId);
    return this.prisma.membership.findMany({
      where: { treeId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // POST /trees/:id/members — OWNER only; 404 unknown user, 409 already member
  async addMember(userId: number, treeId: number, email: string, role: string) {
    await requireRole(this.prisma, userId, treeId, 'OWNER');
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException(`User ${email} not found`);
    const existing = await this.prisma.membership.findUnique({
      where: { userId_treeId: { userId: user.id, treeId } },
    });
    if (existing) throw new ConflictException('Already a member of this tree');
    return this.prisma.membership.create({
      data: { userId: user.id, treeId, role: role as 'OWNER' | 'CONTRIBUTOR' | 'VIEWER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}
