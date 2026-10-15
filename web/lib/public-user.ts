/**
 * Columns of `user` that may be sent to any signed-in client. Never add
 * `email`/`emailVerified` here — use with `with: { user: { columns } }` or
 * `db.query.user.findFirst({ columns })` whenever another user's row leaves
 * the server.
 */
export const publicUserColumns = {
  id: true,
  name: true,
  username: true,
  image: true,
  coverImage: true,
  coverDim: true,
  bio: true,
  location: true,
  website: true,
  createdAt: true,
} as const;
