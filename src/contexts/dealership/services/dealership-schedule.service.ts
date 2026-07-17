import { BadRequestException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipOpenTime } from "../entities/dealership-open-time.entity";
import { DealershipSchedule } from "../entities/dealership-schedule.entity";
import { DealershipNotFoundException } from "../exceptions/dealership-not-found.exception";
import { TypeOrmDealershipRepository } from "../repositories/typeorm.dealership-repository";
import {
  DealershipOpenTimeDto,
  DealershipScheduleDayDto,
  ReplaceDealershipSchedulesPayload,
} from "../types/dealership-schedule";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

@Injectable()
export class DealershipScheduleService {
  constructor(
    @InjectRepository(DealershipSchedule)
    private readonly schedule_repository: Repository<DealershipSchedule>,
    @InjectDataSource()
    private readonly data_source: DataSource,
    private readonly dealership_repository: TypeOrmDealershipRepository,
  ) {}

  async findByDealershipId(
    dealership_id: string,
  ): Promise<DealershipScheduleDayDto[]> {
    const schedules = await this.schedule_repository.find({
      where: { dealership_id },
      relations: { open_times: true },
      order: { day: "ASC" },
    });

    return schedules.map((schedule) => this.toDayDto(schedule));
  }

  async replaceAll(
    payload: ReplaceDealershipSchedulesPayload,
  ): Promise<DealershipScheduleDayDto[]> {
    const dealership = await this.dealership_repository.findOne(
      payload.dealership_id,
    );
    if (!dealership) {
      throw new DealershipNotFoundException(payload.dealership_id);
    }

    this.assertValidSchedules(payload.schedules);

    await this.data_source.transaction(async (manager) => {
      await manager.delete(DealershipSchedule, {
        dealership_id: payload.dealership_id,
      });

      for (const day of payload.schedules) {
        const schedule = manager.create(DealershipSchedule, {
          dealership_id: payload.dealership_id,
          day: day.day,
          open_times: day.open_times.map((slot) =>
            manager.create(DealershipOpenTime, {
              open_time: this.normalizeTime(slot.open_time),
              close_time: this.normalizeTime(slot.close_time),
            }),
          ),
        });
        await manager.save(schedule);
      }
    });

    return this.findByDealershipId(payload.dealership_id);
  }

  private assertValidSchedules(schedules: DealershipScheduleDayDto[]): void {
    const seen_days = new Set<number>();

    for (const schedule of schedules) {
      if (seen_days.has(schedule.day)) {
        throw new BadRequestException(
          `El día ${schedule.day} está duplicado en el horario`,
        );
      }
      seen_days.add(schedule.day);
      this.assertValidOpenTimes(schedule.day, schedule.open_times);
    }
  }

  private assertValidOpenTimes(
    day: number,
    open_times: DealershipOpenTimeDto[],
  ): void {
    for (const slot of open_times) {
      if (!TIME_PATTERN.test(slot.open_time) || !TIME_PATTERN.test(slot.close_time)) {
        throw new BadRequestException(
          `El día ${day}: las horas deben tener formato HH:mm`,
        );
      }

      const open_minutes = this.toMinutes(slot.open_time);
      const close_minutes = this.toMinutes(slot.close_time);

      if (close_minutes <= open_minutes) {
        throw new BadRequestException(
          `El día ${day}: close_time debe ser posterior a open_time`,
        );
      }
    }

    const sorted = [...open_times].sort(
      (a, b) => this.toMinutes(a.open_time) - this.toMinutes(b.open_time),
    );

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (!previous || !current) {
        continue;
      }

      if (this.toMinutes(current.open_time) < this.toMinutes(previous.close_time)) {
        throw new BadRequestException(
          `El día ${day}: los tramos horarios no pueden solaparse`,
        );
      }
    }
  }

  private toDayDto(schedule: DealershipSchedule): DealershipScheduleDayDto {
    const open_times = [...(schedule.open_times ?? [])].sort(
      (a, b) => this.toMinutes(a.open_time) - this.toMinutes(b.open_time),
    );

    return {
      day: Number(schedule.day),
      open_times: open_times.map((slot) => ({
        open_time: this.formatTime(slot.open_time),
        close_time: this.formatTime(slot.close_time),
      })),
    };
  }

  private normalizeTime(value: string): string {
    const match = TIME_PATTERN.exec(value);
    if (!match) {
      return value;
    }

    const hours = match[1];
    const minutes = match[2];
    return `${hours}:${minutes}:00`;
  }

  private formatTime(value: string): string {
    const match = TIME_PATTERN.exec(value);
    if (!match) {
      return value.slice(0, 5);
    }

    return `${match[1]}:${match[2]}`;
  }

  private toMinutes(value: string): number {
    const match = TIME_PATTERN.exec(value);
    if (!match) {
      return 0;
    }

    return Number(match[1]) * 60 + Number(match[2]);
  }
}
