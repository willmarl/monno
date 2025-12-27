export function buildOffsetPageInfo({
  totalItems,
  limit,
  offset,
}: {
  totalItems: number;
  limit: number;
  offset: number;
}) {
  return {
    totalItems,
    limit,
    offset,
    hasNext: offset + limit < totalItems,
    hasPrev: offset > 0,
    nextOffset: offset + limit,
    prevOffset: Math.max(offset - limit, 0),
  };
}
