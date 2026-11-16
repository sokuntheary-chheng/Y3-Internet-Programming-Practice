# Puong API — Entity Relationship Diagram (M2)

Six entities, three of them connected by 1-N relations and two join tables that
turn relations into N-N. Primary keys are `id` (int, auto-increment) on every
box; foreign keys are marked `FK`. The dotted box in the middle is the N-N join.

## Boxes and keys

```text
+--------------------------+          +--------------------------+
| USER                     |          | TREE                     |
|--------------------------|          |--------------------------|
| PK id                    |          | PK id                    |
|    name     (2-100)      |          |    name     (1-100)      |
|    email    (unique)     |          |    description (<=500)   |
|    password (hashed)     |          |    createdAt             |
|    createdAt             |          | FK ownerId -> USER.id    |
+--------------------------+          +--------------------------+
        |        |                            |     |      |
        |        |                            |     |      |
        |        | 1                     1-N  |     |      | 1
        |        +------------------------------+     |      |
        |                   |                          |      |
        |              +----+-----------+   +----------+--+   |
        |              | MEMBERSHIP     |   | PERSON      |   |
        |              | (N-N JOIN)     |   |-------------|   |
        |              |----------------|   | PK id       |   |
        |              | PK id          |   | FK treeId ----+  |
        |              | FK userId ------|--+    name          |
        |              | FK treeId ------|+    gender          |
        |              | role            |    birthDate        |
        |              | createdAt       |    deathDate        |
        |              | UQ (userId,     |    biography        |
        |              |     treeId)     |    createdAt        |
        |              +-----------------+    +----+-------+---+
        |                                        |       |       |
        | 1                                   1-N |       | 1-N  | 1
        |                                          |       |       |
        |              +---------------------------+--+    |   +---+-------------+
        |              | RELATIONSHIP (N-N JOIN)       |    |   | MEMORY          |
        |              |-------------------------------|    |   |-----------------|
        |              | PK id                          |    |   | PK id           |
        |              | FK treeId                      |    |   | FK personId ------+
        |              | FK personId --------------------+---+   | FK authorId ------+
        |              | FK relatedPersonId -------------+       | content (1-2000)  |
        |              | type: parent|spouse|sibling             | createdAt         |
        |              | UQ (treeId, personId,                   +-------------------+
        |              |     relatedPersonId, type)                    |
        +----------------------------------------------+               |
                    1-N: a USER authors many MEMORY rows  <-------------+
```

## Relations, written out

| From | To | Kind | How it is stored |
| --- | --- | --- | --- |
| `Tree` | `User` (owner) | 1-N | `Tree.ownerId` FK on the many side (a user may own several trees) |
| `User` | `Tree` | **N-N** | `Membership` join table: `userId` + `treeId` + `role`, unique pair |
| `Tree` | `Person` | 1-N | `Person.treeId` FK; `onDelete: Cascade` — delete the tree, persons go |
| `Tree` | `Relationship` | 1-N | `Relationship.treeId` FK (both persons must belong to this tree) |
| `Person` | `Person` | **N-N** | `Relationship` self join: `personId` ↔ `relatedPersonId` + `type` |
| `Person` | `Memory` | 1-N | `Memory.personId` FK; cascade — delete the person, memories go |
| `User` | `Memory` | 1-N | `Memory.authorId` FK (who wrote it), cascade with the user |

## Notes

- **Where the "many" side lives:** every 1-N stores the key on the child row
  (`Tree.ownerId`, `Person.treeId`, `Memory.personId/authorId`) — never a list
  column on the parent.
- **The two N-N relations** (`User`–`Tree`, `Person`–`Person`) are real tables,
  not columns: a membership carries its own data (`role`), a relationship
  carries its own data (`type`), and both get a unique index so the same link
  cannot be inserted twice (409).
- **Cascades:** every FK out of `Tree` and `Person` is `onDelete: Cascade`, so
  `DELETE /trees/:id` and `DELETE /persons/:id` remove the dependent rows in
  one statement, exactly as the API contract promises.
- The full schema lives in [`../prisma/schema.prisma`](../prisma/schema.prisma);
  the SQL generated from it is in `../prisma/migrations/*_init/migration.sql`.
