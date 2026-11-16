# Puong API (M2)

Backend of **Puong** — a family-tree app: users share trees, each tree holds
persons, the persons are linked by relationships, and members write memories
about them. The specification is [`docs/api-contract.md`](docs/api-contract.md);
the design is [`docs/erd.md`](docs/erd.md). Data lives in **PostgreSQL** through
**Prisma** (milestone M2 — week 7).

## Prerequisites

- Node.js 20+ and npm
- Docker (for PostgreSQL) — or a local PostgreSQL 16/17 you manage yourself

## 1. Start the database

```bash
docker compose up -d      # PostgreSQL 17 on localhost:5435, database "puong"
```

No Docker? Create the database yourself and point `.env` at it:

```sql
CREATE DATABASE puong;
```

## 2. Configure

```bash
cp .env.example .env      # never commit .env; only .env.example is tracked
```

`DATABASE_URL` must point at your database. `.env` also holds `PORT` (3000) and
`WEB_ORIGIN` (the Vue dev server, for CORS).

## 3. Install, migrate, seed

```bash
npm install               # also runs prisma generate (postinstall)
npm run db:migrate        # writes prisma/migrations/*_init/migration.sql and runs it
npm run db:seed           # 3 users, 1 tree, 6 persons, 9 relationships, 3 memories
```

Useful extras:

```bash
npm run db:studio         # browse the data in the browser
npm run db:reset          # drop, re-migrate and re-seed
```

## 4. Run the API

```bash
npm run start:dev         # http://localhost:3000, restarts when you save
# or
npm run build && npm run start:prod
```

Everything in [`requests.http`](requests.http) can be sent with the VS Code
REST Client extension.

## Trying it (curl)

```bash
# log in as the seeded OWNER — the token is what every other call needs
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"theary@puong.kh","password":"theary-password"}'
# → { "token": "…" }

TOKEN=…  # from the response above

curl -s http://localhost:3000/trees -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/trees/1/persons -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/trees/1/relationships -H "Authorization: Bearer $TOKEN"
```

Seeded accounts (password after the dash):

| Email | Role in "The Chanthou Family" |
| --- | --- |
| `theary@puong.kh` | OWNER — `theary-password` |
| `chanthou@puong.kh` | CONTRIBUTOR — `chanthou-password` |
| `dara@puong.kh` | VIEWER — `dara-password` |

## How it is put together

```text
src/
├── main.ts             # dotenv, ValidationPipe (whitelist + forbid), CORS
├── app.module.ts       # wires the 6 feature modules + Prisma + Auth
├── prisma/             # PrismaService: ONE PrismaClient for the whole app
├── auth/               # register/login/token guard + role checks (access.ts)
├── trees/              # /trees CRUD, /trees/:id/members
├── members/            # PATCH/DELETE /members/:id
├── persons/            # /trees/:id/persons, /persons/:id
├── relationships/      # /trees/:id/relationships, /relationships/:id
└── memories/           # /persons/:id/memories, /memories/:id
```

Three rules the code keeps, from the contract:

- **Status codes**: 404 when the row does not exist, 403 when the caller's role
  is too low (`access.ts` compares `VIEWER < CONTRIBUTOR < OWNER`), 409 for
  duplicate e-mails and duplicate links (unique indexes do the work).
- **Server-owned fields** (`id`, `createdAt`, `ownerId`, `authorId`): never in a
  DTO, so `forbidNonWhitelisted` answers 400 if a client sends them.
- **Two writes in one `$transaction`**: creating a tree also writes the OWNER
  membership (`trees.service.ts`); creating a relationship checks both persons
  and inserts in one transaction (`relationships.service.ts`). Everything else
  is a single statement, and `onDelete: Cascade` covers the rest.

## Tests and checks

```bash
npm run lint              # oxlint
npm run build             # nest build — must be error-free
npm test                  # vitest unit tests
npm run test:e2e          # HTTP tests
```

## Never commit `.env`

`.env` is in `.gitignore`. What IS committed: `.env.example`, `prisma/schema.prisma`
and `prisma/migrations/` — every teammate and every server runs the same SQL.
