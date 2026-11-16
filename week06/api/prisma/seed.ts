// Run with: npx prisma db seed (see prisma.config.ts)
import 'dotenv/config';
import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Same format as AuthService.hash(): "salt:scryptHex", so login works for
// real on the seeded accounts.
function hash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

// Deletes in dependency order (children first), then rebuilds a small but
// realistic world: three users, one shared family tree, six persons of three
// generations, their relationships and a few memories.
async function resetDatabase() {
  await prisma.memory.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.person.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.tree.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await resetDatabase();

  // Theary, Chanthou and Dara — login with the email and password below.
  const [theary, sokun, dara] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Chheng Sokuntheary',
        email: 'theary@puong.kh',
        password: hash('theary-password'),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sok Chanthou',
        email: 'chanthou@puong.kh',
        password: hash('chanthou-password'),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Ly Dara',
        email: 'dara@puong.kh',
        password: hash('dara-password'),
      },
    }),
  ]);

  // theary owns the tree; chanthou contributes; dara only reads.
  const tree = await prisma.tree.create({
    data: {
      name: 'The Chanthou Family',
      description:
        'Four generations of the Chanthou family from Kampong Cham, kept by the whole family.',
      ownerId: theary.id,
      memberships: {
        create: [
          { userId: theary.id, role: 'OWNER' },
          { userId: sokun.id, role: 'CONTRIBUTOR' },
          { userId: dara.id, role: 'VIEWER' },
        ],
      },
    },
  });

  const [grandpa, grandma, father, mother, chan, vanda] = await Promise.all([
    prisma.person.create({
      data: {
        treeId: tree.id,
        name: 'Chanthou Sovann',
        gender: 'male',
        birthDate: new Date('1938-04-12'),
        deathDate: new Date('2015-11-02'),
        biography: 'Village teacher in Kampong Cham for thirty years.',
      },
  }),
    prisma.person.create({
      data: {
        treeId: tree.id,
        name: 'Men Sophea',
        gender: 'female',
        birthDate: new Date('1942-09-30'),
        biography: 'Weaves krama and keeps the family recipes.',
      },
    }),
    prisma.person.create({
      data: {
        treeId: tree.id,
        name: 'Chanthou Vichet',
        gender: 'male',
        birthDate: new Date('1965-01-18'),
        biography: 'Engineer at Phnom Penh Water Supply.',
      },
    }),
    prisma.person.create({
      data: {
        treeId: tree.id,
        name: 'Sok Bopha',
        gender: 'female',
        birthDate: new Date('1968-07-05'),
        biography: 'Nurse and the family archivist — scans every old photo.',
      },
    }),
    prisma.person.create({
      data: {
        treeId: tree.id,
        name: 'Chanthou Chanvirak',
        gender: 'male',
        birthDate: new Date('1994-03-22'),
        biography: 'Studies computer science in Phnom Penh.',
      },
    }),
    prisma.person.create({
      data: {
        treeId: tree.id,
        name: 'Chanthou Vanda',
        gender: 'female',
        birthDate: new Date('1998-12-11'),
        biography: 'Teaches at a school in Kampong Cham town.',
      },
    }),
  ]);

  await prisma.relationship.createMany({
    data: [
      { treeId: tree.id, personId: grandpa.id, relatedPersonId: grandma.id, type: 'spouse' },
      { treeId: tree.id, personId: grandpa.id, relatedPersonId: father.id, type: 'parent' },
      { treeId: tree.id, personId: grandma.id, relatedPersonId: father.id, type: 'parent' },
      { treeId: tree.id, personId: father.id, relatedPersonId: mother.id, type: 'spouse' },
      { treeId: tree.id, personId: father.id, relatedPersonId: chan.id, type: 'parent' },
      { treeId: tree.id, personId: mother.id, relatedPersonId: chan.id, type: 'parent' },
      { treeId: tree.id, personId: father.id, relatedPersonId: vanda.id, type: 'parent' },
      { treeId: tree.id, personId: mother.id, relatedPersonId: vanda.id, type: 'parent' },
      { treeId: tree.id, personId: chan.id, relatedPersonId: vanda.id, type: 'sibling' },
    ],
  });

  await prisma.memory.createMany({
    data: [
      {
        personId: grandma.id,
        authorId: theary.id,
        content:
          'Grandma still makes amok every Khmer New Year and refuses to write the recipe down.',
      },
      {
        personId: grandpa.id,
        authorId: sokun.id,
        content:
          'Grandpa Sovann kept a diary from 1960 — we scanned it and it is in the family drive.',
      },
      {
        personId: chan.id,
        authorId: theary.id,
        content: 'Chanvirak fixed the old photo scanner and digitised 240 pictures.',
      },
    ],
  });

  console.log(
    `Seeded: ${await prisma.user.count()} users, ${await prisma.tree.count()} tree, ` +
      `${await prisma.person.count()} persons, ${await prisma.relationship.count()} relationships, ` +
      `${await prisma.memory.count()} memories`,
  );
}

await main();
await prisma.$disconnect();
