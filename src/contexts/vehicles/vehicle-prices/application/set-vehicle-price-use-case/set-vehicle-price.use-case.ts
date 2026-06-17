import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";
import { ALERT_EVENT_TYPE } from "@/src/contexts/alerts/domain/enums/alert-event-type.enum";

import { VehiclePriceNotFoundException } from "../../domain/exceptions/vehicle-price-not-found.exception";
import { VehiclePrice, VEHICLE_PRICE_STATUS } from "../../domain/vehicle-price";
import { VehiclePriceRepository } from "../../domain/vehicle-price.repository";
import { SetVehiclePriceDto } from "./set-vehicle-price.dto";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";

@Injectable()
export class SetVehiclePriceUseCase {
  constructor(
    private readonly vehicle_price_repository: VehiclePriceRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly alert_processing_enqueue_service: AlertProcessingEnqueueService,
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async execute(dto: SetVehiclePriceDto): Promise<void> {
    const { vehicle_id, price, vehicle_price_id } = dto;

    if (vehicle_price_id) {
      const existing = await this.vehicle_price_repository.findOneByIdAndVehicleId(
        vehicle_price_id,
        vehicle_id,
      );
      if (!existing) {
        throw new VehiclePriceNotFoundException(vehicle_price_id, vehicle_id);
      }
      await this.vehicle_price_repository.activatePrice(vehicle_id, vehicle_price_id);
      await this.vehicle_search_indexer.indexVehicle(vehicle_id);
      return;
    }

    if (price === undefined) {
      return;
    }

    const active = await this.vehicle_price_repository.findActiveByVehicleId(vehicle_id);
    const previous_price = active?.toPrimitives().price;
    if (previous_price === price) {
      return;
    }

    const new_price = VehiclePrice.create({
      price,
      vehicle_id,
      status: VEHICLE_PRICE_STATUS.ACTIVE,
    });
    await this.vehicle_price_repository.create(new_price);
    await this.vehicle_search_indexer.indexVehicle(vehicle_id);

    if (previous_price !== undefined && price < previous_price) {
      const status_rows = await this.data_source.query<Array<{ status: string }>>(
        `SELECT status FROM vehicles WHERE id = $1 LIMIT 1`,
        [vehicle_id],
      );
      if (status_rows[0]?.status === "active") {
        await this.alert_processing_enqueue_service.enqueue_vehicle_event({
          vehicle_id,
          event_type: ALERT_EVENT_TYPE.PRICE_DROP,
          metadata: {
            previous_price,
            vehicle_price: price,
          },
        });
      }
    }
  }
}
