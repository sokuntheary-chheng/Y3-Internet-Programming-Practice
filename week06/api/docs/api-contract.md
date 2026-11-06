# Puong API contract (M2)

Base URL: `http://localhost:3000`. All bodies are JSON. Errors use Nest's format:
`{ "statusCode": 400, "message": ["..."], "error": "Bad Request" }`.

Every endpoint except `POST /auth/register` and `POST /auth/login` requires a login (401 without a
valid token). Authentication is built in week 8; the roles below are decided now and enforced then.
Ids, `createdAt`, `ownerId` and `authorId` are set by the server — a client that sends them gets 400.

## Resources

**User**: `id` (int), `name` (2–100 chars), `email` (valid, unique, used to log in),
`password` (write-only, 8+ chars, stored hashed and never returned), `createdAt` (ISO 8601, server).

**Tree**: `id` (int), `name` (1–100 chars), `description` (≤ 500 chars, optional, default `""`),
`createdAt` (ISO 8601, server), `ownerId` (int, server — the user who created it).

**Person**: `id` (int), `treeId` (int, server), `name` (1–100 chars),
`gender` (`male` | `female` | `other`, optional), `birthDate` (ISO 8601 date, optional),
`deathDate` (ISO 8601 date, optional, must not be before `birthDate`),
`biography` (≤ 2000 chars, optional).

**Membership**: `id` (int), `userId` (int), `treeId` (int), `role` (`OWNER` | `CONTRIBUTOR` | `VIEWER`),
`createdAt` (ISO 8601, server). One membership per (user, tree): inviting twice is 409.

**Relationship**: `id` (int), `treeId` (int, server), `personId` (int), `relatedPersonId` (int),
`type` (`parent` | `spouse` | `sibling`), `createdAt` (ISO 8601, server).
Both persons must belong to the same tree, and `personId` must differ from `relatedPersonId`.

**Memory**: `id` (int), `personId` (int), `authorId` (int, server — who wrote it),
`content` (1–2000 chars), `createdAt` (ISO 8601, server). A memory belongs to one person.

## Roles

| Role | May do |
| --- | --- |
| VIEWER | read everything in the tree |
| CONTRIBUTOR | VIEWER's rights, plus add/edit persons, relationships and memories |
| OWNER | CONTRIBUTOR's rights, plus rename/delete the tree and manage members |

## Endpoints

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | name, email, password | 201 User (no password) | 400, 409 email taken |
| POST | `/auth/login` | email, password | 200 `{ token }` | 400, 401 wrong credentials |
| GET | `/me` | | 200 User | 401 |
| GET | `/trees` | | 200 Tree[] the caller belongs to | 401 |
| POST | `/trees` | name, description? | 201 Tree; caller becomes OWNER | 400, 401 |
| GET | `/trees/:id` | | 200 Tree | 400, 401, 403 not a member, 404 |
| PATCH | `/trees/:id` | name?, description? | 200 Tree | 400, 401, 403 not OWNER, 404 |
| DELETE | `/trees/:id` | | 204; tree, persons and memberships removed | 401, 403 not OWNER, 404 |
| GET | `/trees/:id/members` | | 200 Membership[] | 401, 403, 404 |
| POST | `/trees/:id/members` | email, role | 201 Membership | 400, 401, 403 not OWNER, 404 user, 409 already member |
| PATCH | `/members/:id` | role | 200 Membership | 400, 401, 403 not OWNER, 404 |
| DELETE | `/members/:id` | | 204 | 401, 403 not OWNER, 404 |
| GET | `/trees/:id/persons` | | 200 Person[] | 401, 403, 404 |
| POST | `/trees/:id/persons` | name, gender?, birthDate?, deathDate?, biography? | 201 Person | 400, 401, 403 VIEWER, 404 |
| GET | `/persons/:id` | | 200 Person | 401, 403, 404 |
| PATCH | `/persons/:id` | any Person field except id, treeId | 200 Person | 400, 401, 403, 404 |
| DELETE | `/persons/:id` | | 204; its relationships and memories removed | 401, 403, 404 |
| GET | `/trees/:id/relationships` | | 200 Relationship[] | 401, 403, 404 |
| POST | `/trees/:id/relationships` | personId, relatedPersonId, type | 201 Relationship | 400, 401, 403 VIEWER, 404 person not in this tree, 409 duplicate |
| DELETE | `/relationships/:id` | | 204 | 401, 403, 404 |
| GET | `/persons/:id/memories` | | 200 Memory[] | 401, 403, 404 |
| POST | `/persons/:id/memories` | content | 201 Memory | 400, 401, 403 VIEWER, 404 |
| DELETE | `/memories/:id` | | 204 (author or tree OWNER) | 401, 403, 404 |

Not in this version (added later): login for real (week 8), pagination, photo uploads,
invitation links. `db.json` from M1 keeps the same shape: one array per resource, `treeId`/`personId`
link the rows together.
