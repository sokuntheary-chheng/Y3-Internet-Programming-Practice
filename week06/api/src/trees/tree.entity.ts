// The shape the API returns. Same fields as docs/api-contract.md.
// id, createdAt and ownerId are set by the server, never by the client.
//
// Since M2 the rows live in PostgreSQL, so the real type comes from the
// generated Prisma client — this alias keeps the contract's name working
// everywhere without a second definition drifting apart from the schema.
export type { Tree } from '../generated/prisma/client.js';
