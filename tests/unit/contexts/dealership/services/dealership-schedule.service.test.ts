import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DealershipScheduleService } from "@/contexts/dealership/services/dealership-schedule.service";
import { Dealership } from "@/contexts/dealership/types/dealership";

describe("DealershipScheduleService", () => {
  const schedule_repository = {
    find: vi.fn(),
  };
  const data_source = {
    transaction: vi.fn(),
  };
  const dealership_repository = {
    findOne: vi.fn(),
  };

  let service: DealershipScheduleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DealershipScheduleService(
      schedule_repository as never,
      data_source as never,
      dealership_repository as never,
    );
  });

  describe("replaceAll", () => {
    it("rejects overlapping open times on the same day", async () => {
      dealership_repository.findOne.mockResolvedValue(
        Dealership.fromPrimitives({
          id: "d1",
          name: "Test",
          slug: "test",
          description: "desc",
          email: "a@b.com",
          phone_code: "+34",
          phone: "600000000",
          address: "Calle 1",
          is_featured: false,
          show_phone: true,
          rating: null,
          created_at: new Date("2026-01-01"),
          updated_at: new Date("2026-01-01"),
        }),
      );

      await expect(
        service.replaceAll({
          dealership_id: "d1",
          schedules: [
            {
              day: 1,
              open_times: [
                { open_time: "09:00", close_time: "14:00" },
                { open_time: "13:00", close_time: "18:00" },
              ],
            },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(data_source.transaction).not.toHaveBeenCalled();
    });

    it("rejects close_time earlier than or equal to open_time", async () => {
      dealership_repository.findOne.mockResolvedValue(
        Dealership.fromPrimitives({
          id: "d1",
          name: "Test",
          slug: "test",
          description: "desc",
          email: "a@b.com",
          phone_code: "+34",
          phone: "600000000",
          address: "Calle 1",
          is_featured: false,
          show_phone: true,
          rating: null,
          created_at: new Date("2026-01-01"),
          updated_at: new Date("2026-01-01"),
        }),
      );

      await expect(
        service.replaceAll({
          dealership_id: "d1",
          schedules: [
            {
              day: 2,
              open_times: [{ open_time: "18:00", close_time: "09:00" }],
            },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("replaces schedules in a transaction and returns ordered days", async () => {
      dealership_repository.findOne.mockResolvedValue(
        Dealership.fromPrimitives({
          id: "d1",
          name: "Test",
          slug: "test",
          description: "desc",
          email: "a@b.com",
          phone_code: "+34",
          phone: "600000000",
          address: "Calle 1",
          is_featured: false,
          show_phone: true,
          rating: null,
          created_at: new Date("2026-01-01"),
          updated_at: new Date("2026-01-01"),
        }),
      );

      data_source.transaction.mockImplementation(async (callback) => {
        const manager = {
          delete: vi.fn(),
          create: (_entity: unknown, data: unknown) => data,
          save: vi.fn().mockResolvedValue(undefined),
        };
        await callback(manager);
      });

      schedule_repository.find.mockResolvedValue([
        {
          day: 1,
          open_times: [
            { open_time: "09:00:00", close_time: "14:00:00" },
            { open_time: "16:00:00", close_time: "20:00:00" },
          ],
        },
        {
          day: 7,
          open_times: [],
        },
      ]);

      const result = await service.replaceAll({
        dealership_id: "d1",
        schedules: [
          {
            day: 1,
            open_times: [
              { open_time: "09:00", close_time: "14:00" },
              { open_time: "16:00", close_time: "20:00" },
            ],
          },
          { day: 7, open_times: [] },
        ],
      });

      expect(data_source.transaction).toHaveBeenCalledOnce();
      expect(result).toEqual([
        {
          day: 1,
          open_times: [
            { open_time: "09:00", close_time: "14:00" },
            { open_time: "16:00", close_time: "20:00" },
          ],
        },
        {
          day: 7,
          open_times: [],
        },
      ]);
    });
  });
});
