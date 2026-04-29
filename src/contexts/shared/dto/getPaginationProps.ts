import { PaginationDto } from "./pagination.dto";

interface PaginationProps {
  skip: number;
  take: number;
  order_column: string;
  direction: "asc" | "desc";
}

export const getPaginationProps = (paginationDto: PaginationDto): PaginationProps => {
  const { page, limit, order_by, order_direction } = paginationDto;
  const skip = (page - 1) * limit;
  const order_column = order_by && order_by.length > 0 ? order_by : "created_at";
  const direction = order_direction ?? "asc";
  return { skip, take: limit, order_column, direction };
}