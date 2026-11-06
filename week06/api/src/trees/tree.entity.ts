// The shape the API returns. Same fields as docs/api-contract.md.
// id, createdAt and ownerId are set by the server, never by the client.
export interface Tree {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  ownerId: number;
}
