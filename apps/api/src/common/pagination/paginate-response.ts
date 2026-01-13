export function buildOffsetPageInfo({
  totalItems,
  limit,
  offset,
  requestedOffset,
}: {
  totalItems: number;
  limit: number;
  offset: number;
  requestedOffset?: number;
}) {
  const hasNext = offset + limit < totalItems;
  const pageInfo: any = {
    totalItems,
    limit,
    offset,
    hasNext,
    hasPrev: offset > 0,
    nextOffset: hasNext ? offset + limit : null,
    prevOffset: offset > 0 ? Math.max(offset - limit, 0) : null,
  };

  if (requestedOffset !== undefined && requestedOffset !== offset) {
    pageInfo.requestedOffset = requestedOffset;
  }

  return pageInfo;
}
