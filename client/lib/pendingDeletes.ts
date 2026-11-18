// Reviews deleted optimistically whose DB delete is still inside its undo
// window. Module-level (not component state) so it survives the My Reviews
// screen unmounting and remounting during the window: a refetch must not
// resurrect a row the user just deleted.
const pending = new Set<string>();

export const pendingDeletes = {
  add: (id: string) => pending.add(id),
  remove: (id: string) => pending.delete(id),
  has: (id: string) => pending.has(id),
  /** Test helper. */
  clear: () => pending.clear(),
};
