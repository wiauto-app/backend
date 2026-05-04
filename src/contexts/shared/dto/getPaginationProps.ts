import { PaginationDto } from "../application/dtos/pagination.dto";

interface PaginationProps {
  skip: number;
  take: number;
  order_column: string;
  direction: "asc" | "desc";
}

export type PaginationPropsInput = Pick<
  PaginationDto,
  "page" | "limit" | "order_by" | "order_direction"
>;

export const getPaginationProps = (
  paginationDto: PaginationPropsInput,
  fallback_order_column = "created_at",
): PaginationProps => {
  const page = paginationDto.page ?? 1;
  const limit = paginationDto.limit ?? 10;
  const { order_by, order_direction } = paginationDto;
  const skip = (page - 1) * limit;
  const order_column =
    order_by && order_by.length > 0 ? order_by : fallback_order_column;
  const direction = order_direction ?? "asc";
  return { skip, take: limit, order_column, direction };
};