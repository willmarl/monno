import { buildOffsetPageInfo } from './paginate-response';

export async function offsetPaginate<T>({
  model,
  limit,
  offset,
  query, // model-specific logic
  countQuery, // model-specific count
}: {
  model: any; // e.g. prisma.post
  limit: number;
  offset: number;
  query: any; // findMany params except skip/take
  countQuery?: any; // custom count if needed
}): Promise<{
  items: T[];
  pageInfo: any;
}> {
  const [totalItems, items] = await Promise.all([
    // @ts-ignore dynamic Prisma access
    model.count(countQuery),
    // @ts-ignore dynamic Prisma access
    model.findMany({
      skip: offset,
      take: limit,
      ...query,
    }),
  ]);

  return {
    items,
    pageInfo: buildOffsetPageInfo({ totalItems, limit, offset }),
  };
}
