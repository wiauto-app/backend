import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Request } from "express";
import { Repository } from "typeorm";

import { User } from "@/src/contexts/users/entities/user.entity";
import { VersionEntity } from "@/src/contexts/vehicles/catalog/versions/entities/version.entity";
import { VehicleTypeEntity } from "@/src/contexts/vehicles/entities/vehicle-type.entity";
import { VehiclePublishTrackingHttpDto } from "../dto/vehicle-publish-tracking.http-dto";
import { MetaCapiService, MetaCapiUserInput } from "./meta-capi.service";

export interface VehiclePublishListingSnapshot {
  id: string;
  price: number;
  versionId: number;
  vehicleTypeId?: string | null;
  province?: string | null;
  city?: string | null;
  zip?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface VehiclePublishCapiContext {
  tracking?: VehiclePublishTrackingHttpDto;
  user: User;
  req: Request;
  listing: VehiclePublishListingSnapshot;
}

interface CatalogLabels {
  brand?: string;
  model?: string;
  year?: number;
  vehicleType?: string;
}

@Injectable()
export class VehiclePublishMetaCapiService {
  constructor(
    private readonly meta_capi_service: MetaCapiService,
    @InjectRepository(VersionEntity)
    private readonly version_repository: Repository<VersionEntity>,
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicle_type_repository: Repository<VehicleTypeEntity>,
  ) {}

  sendAfterVehicleCreated(context: VehiclePublishCapiContext): void {
    const tracking = context.tracking;
    if (tracking?.consent !== true) {
      return;
    }

    const publishEventId = tracking.eventId?.trim();
    const vehicleDataEventId = tracking.vehicleDataEventId?.trim();
    if (!publishEventId && !vehicleDataEventId) {
      return;
    }

    void this.dispatch(context, publishEventId, vehicleDataEventId).catch(
      () => {
        console.error("meta capi listing failed");
      },
    );
  }

  private async dispatch(
    context: VehiclePublishCapiContext,
    publishEventId: string | undefined,
    vehicleDataEventId: string | undefined,
  ) {
    const tracking = context.tracking;
    if (!tracking) {
      return;
    }

    const labels = await this.resolveCatalog(context.listing);
    const user = this.buildUser(context);

    if (vehicleDataEventId) {
      await this.meta_capi_service.sendMetaEvent({
        eventName: "PublicarDatos",
        eventId: vehicleDataEventId,
        pageUrl: tracking.pageUrl,
        req: context.req,
        fbp: tracking.fbp,
        fbc: tracking.fbc,
        user,
        customData: {
          brand: labels.brand,
          model: labels.model,
          year: labels.year,
          value: Number(context.listing.price),
          currency: "EUR",
        },
      });
    }

    if (!publishEventId) {
      return;
    }

    await this.meta_capi_service.sendMetaEvent({
      eventName: "AnuncioPublicado",
      eventId: publishEventId,
      pageUrl: tracking.pageUrl,
      req: context.req,
      fbp: tracking.fbp,
      fbc: tracking.fbc,
      user,
      customData: {
        listing_id: context.listing.id,
        content_type: "vehicle",
        vehicle_type: labels.vehicleType,
        brand: labels.brand,
        model: labels.model,
        value: Number(context.listing.price),
        currency: "EUR",
        province: context.listing.province ?? undefined,
      },
    });
  }

  private buildUser(context: VehiclePublishCapiContext): MetaCapiUserInput {
    const profile = context.user.profile;
    return {
      id: context.user.id,
      email: context.user.email || context.listing.email || undefined,
      phone: context.listing.phone || profile?.phone || undefined,
      firstName: profile?.name,
      lastName: profile?.last_name,
      city: context.listing.city ?? undefined,
      zip: context.listing.zip ?? undefined,
    };
  }

  private async resolveCatalog(
    listing: VehiclePublishListingSnapshot,
  ): Promise<CatalogLabels> {
    try {
      const [version, vehicleType] = await Promise.all([
        this.version_repository.findOne({
          where: { id: listing.versionId },
          relations: ["make", "model", "year"],
        }),
        listing.vehicleTypeId
          ? this.vehicle_type_repository.findOne({
              where: { id: listing.vehicleTypeId },
            })
          : Promise.resolve(null),
      ]);

      return {
        brand: version?.make?.name,
        model: version?.model?.name,
        year: version?.year?.year,
        vehicleType: vehicleType?.name,
      };
    } catch {
      console.error("meta capi catalog lookup failed");
      return {};
    }
  }
}
