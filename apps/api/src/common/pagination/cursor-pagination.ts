import { Prisma } from '../../generated/prisma/client';

export interface CursorPaginateArgs {
  model: any; // prisma.post
  limit: number;
  cursor?: string | null;
  query: Prisma.UserFindManyArgs; // model-specific includes, filters, WHERE
}

export async function cursorPaginate<T>({
  model,
  limit,
  cursor,
  query,
}: CursorPaginateArgs): Promise<{
  items: T[];
  nextCursor: string | null;
}> {
  const items = await model.findMany({
    take: limit + 1, // fetch one extra to detect next page
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    ...query,
  });

  // Determine next cursor
  let nextCursor: string | null = null;

  if (items.length > limit) {
    const nextItem = items.pop(); // remove the extra item
    nextCursor = nextItem!.id;
  }

  return {
    items,
    nextCursor,
  };
}
