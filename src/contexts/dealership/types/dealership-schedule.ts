export interface DealershipOpenTimeDto {
  open_time: string;
  close_time: string;
}

export interface DealershipScheduleDayDto {
  day: number;
  open_times: DealershipOpenTimeDto[];
}

export interface ReplaceDealershipSchedulesPayload {
  dealership_id: string;
  schedules: DealershipScheduleDayDto[];
}
