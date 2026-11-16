import { Injectable, NotFoundException } from '@nestjs/common';
import type { Membership } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { requireRole } from '../auth/access.js';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  // The caller must be OWNER of the tree this membership belongs to.
  private async ownedTreeOf(userId: number, id: number): Promise<Membership> {
    const membership = await this.prisma.membership.findUnique({ where: { id } });
    if (!membership) throw new NotFoundException(`Membership ${id} not found`);
    await requireRole(this.prisma, userId, membership.treeId, 'OWNER');
    return membership;
  }

  // PATCH /members/:id — 200 Membership, 403 if the caller is not OWNER
  async update(userId: number, id: number, role: string): Promise<Membership> {
    await this.ownedTreeOf(userId, id);
    return this.prisma.membership.update({
      where: { id },
      data: { role: role as 'OWNER' | 'CONTRIBUTOR' | 'VIEWER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // DELETE /members/:id — 204
  async remove(userId: number, id: number): Promise<void> {
    await this.ownedTreeOf(userId, id);
    await this.prisma.membership.delete({ where: { id } });
  }
}
