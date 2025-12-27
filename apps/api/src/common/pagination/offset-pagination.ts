import { buildOffsetPageInfo } from './paginate-response';

export async function offsetPaginate<T>({
  prisma,
  model,
  limit,
  offset,
  query, // model-specific logic
  countQuery, // model-specific count
}: {
  prisma: any; // PrismaService instance
  model: string; // e.g. 'user'
  limit: number;
  offset: number;
  query: any; // findMany params except skip/take
  countQuery?: any; // custom count if needed
}): Promise<{
  items: T[];
  pageInfo: any;
}> {
  // @ts-ignore dynamic Prisma access
  const prismaModel = prisma[model];

  const [totalItems, items] = await Promise.all([
    // @ts-ignore dynamic Prisma access
    prismaModel.count(countQuery),
    // @ts-ignore dynamic Prisma access
    prismaModel.findMany({
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
