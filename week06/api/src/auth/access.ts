import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Membership, Prisma, Role } from '../generated/prisma/client.js';

// Contract roles, weakest first: VIEWER < CONTRIBUTOR < OWNER.
const RANK: Record<Role, number> = { VIEWER: 0, CONTRIBUTOR: 1, OWNER: 2 };

type Db = Pick<Prisma.TransactionClient, 'membership' | 'tree'>;

// Loads the tree (404 if missing) and the caller's membership in it (403 if none).
export async function requireMembership(
  db: Db,
  userId: number,
  treeId: number,
): Promise<Membership> {
  const tree = await db.tree.findUnique({ where: { id: treeId } });
  if (!tree) throw new NotFoundException(`Tree ${treeId} not found`);
  const membership = await db.membership.findUnique({
    where: { userId_treeId: { userId, treeId } },
  });
  // 403 not a member (contract)
  if (!membership) throw new ForbiddenException(`Not a member of tree ${treeId}`);
  return membership;
}

// Same as requireMembership, but the caller's role must reach `min`
// (403 "VIEWER may not..." / "only OWNER may...").
export async function requireRole(
  db: Db,
  userId: number,
  treeId: number,
  min: Role,
): Promise<Membership> {
  const membership = await requireMembership(db, userId, treeId);
  if (RANK[membership.role] < RANK[min]) {
    throw new ForbiddenException(`${membership.role} may not do this; ${min} required`);
  }
  return membership;
}

// For routes addressed by the child row (/persons/:id, /memories/:id, ...):
// load the row (404), then apply the role rule on the tree it belongs to.
export async function requireTreeRole(
  db: Db,
  userId: number,
  treeId: number,
  min: Role,
): Promise<Membership> {
  return requireRole(db, userId, treeId, min);
}
