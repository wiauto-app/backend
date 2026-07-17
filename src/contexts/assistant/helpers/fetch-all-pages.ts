import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

export const fetchAllPages = async <T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResult<T>>,
  limitPerPage = 100,
): Promise<T[]> => {
  const firstPage = await fetchPage(1, limitPerPage);
  const items = [...firstPage.data];

  if (firstPage.total <= limitPerPage) {
    return items;
  }

  const totalPages = Math.ceil(firstPage.total / limitPerPage);

  for (let page = 2; page <= totalPages; page += 1) {
    const pageResult = await fetchPage(page, limitPerPage);
    items.push(...pageResult.data);
  }

  return items;
};
