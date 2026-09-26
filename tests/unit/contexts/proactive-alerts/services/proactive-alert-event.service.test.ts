import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/contexts/vehicles/entities/vehicle-images-entity.relation-type", () => ({
  get_vehicle_images_entity: () => class VehicleImagesEntity {},
}));

vi.mock(
  "@/src/contexts/vehicles/vehicle-images/entities/vehicle-images.entity",
  () => ({
    VehicleImagesEntity: class VehicleImagesEntity {},
  }),
);

vi.mock("@/src/contexts/vehicles/repositories/typeorm.lead-repository", () => ({
  TypeOrmLeadRepository: class TypeOrmLeadRepository {},
}));

vi.mock("@/src/contexts/proactive-alerts/services/proactive-alert-dispatch.service", () => ({
  ProactiveAlertDispatchService: class ProactiveAlertDispatchService {},
}));

import { ProactiveAlertEventService } from "@/src/contexts/proactive-alerts/services/proactive-alert-event.service";
import type { VehicleListItem } from "@/src/contexts/vehicles/types/vehicle-list-item";

const buildListingItem = (
  overrides: Partial<VehicleListItem> & Pick<VehicleListItem, "id">,
): VehicleListItem =>
  ({
    is_premium: false,
    is_featured: false,
    ref: null,
    price: 10000,
    mileage: 50000,
    lat: 0,
    lng: 0,
    condition: "used",
    version_summary: {
      make_name: "Volkswagen",
      model_name: "Golf",
      version_name: "1.5 TSI",
      fuel_name: "Gasolina",
    },
    created_at: new Date(),
    publisher_type: "dealership",
    power: 110,
    transmission_type: "manual",
    displacement: 1498,
    show_first_cuota: false,
    by_brand_warranty: false,
    show_exact_location: true,
    show_review_collab: false,
    finance_price: null,
    dealership: null,
    images: [],
    features: [],
    services: [],
    vehicle_type: null,
    category: null,
    color: null,
    dgt_label: null,
    warranty_type: null,
    cuotas: [],
    publisher: {
      id: "seller-1",
      name: "Concesionario",
      avatar_url: "",
    },
    ...overrides,
  }) as VehicleListItem;

const buildService = () => {
  const dispatch_service = { tryDispatch: vi.fn().mockResolvedValue(undefined) };
  const enqueue_service = {};
  const lead_repository = {};

  const service = new ProactiveAlertEventService(
    dispatch_service as never,
    enqueue_service as never,
    lead_repository as never,
  );

  const onMatchingBuyerSearch = vi.spyOn(service, "onMatchingBuyerSearch");

  return { service, dispatch_service, onMatchingBuyerSearch };
};

describe("ProactiveAlertEventService.notifyPremiumSellersFromListingPage", () => {
  it("no notifica si models_slugs está vacío", async () => {
    const { service, onMatchingBuyerSearch } = buildService();

    await service.notifyPremiumSellersFromListingPage({
      viewer_profile_id: "buyer-1",
      models_slugs: [],
      listing_items: [
        buildListingItem({ id: "vehicle-1", is_premium: true }),
      ],
    });

    expect(onMatchingBuyerSearch).not.toHaveBeenCalled();
  });

  it("no notifica anuncios que no son premium", async () => {
    const { service, onMatchingBuyerSearch } = buildService();

    await service.notifyPremiumSellersFromListingPage({
      viewer_profile_id: "buyer-1",
      models_slugs: ["golf"],
      listing_items: [
        buildListingItem({ id: "vehicle-1", is_premium: false }),
      ],
    });

    expect(onMatchingBuyerSearch).not.toHaveBeenCalled();
  });

  it("no notifica al propio comprador cuando es el owner", async () => {
    const { service, onMatchingBuyerSearch } = buildService();

    await service.notifyPremiumSellersFromListingPage({
      viewer_profile_id: "seller-1",
      models_slugs: ["golf"],
      listing_items: [
        buildListingItem({
          id: "vehicle-1",
          is_premium: true,
          publisher: { id: "seller-1", name: "Yo", avatar_url: "" },
        }),
      ],
    });

    expect(onMatchingBuyerSearch).not.toHaveBeenCalled();
  });

  it("notifica al owner premium de cada anuncio visible", async () => {
    const { service, onMatchingBuyerSearch } = buildService();
    onMatchingBuyerSearch.mockResolvedValue(undefined);

    await service.notifyPremiumSellersFromListingPage({
      viewer_profile_id: "buyer-1",
      models_slugs: ["golf"],
      listing_items: [
        buildListingItem({ id: "vehicle-1", is_premium: true }),
        buildListingItem({
          id: "vehicle-2",
          is_premium: true,
          publisher: { id: "seller-2", name: "Otro", avatar_url: "" },
        }),
        buildListingItem({ id: "vehicle-3", is_premium: false }),
      ],
    });

    expect(onMatchingBuyerSearch).toHaveBeenCalledTimes(2);
    expect(onMatchingBuyerSearch).toHaveBeenCalledWith({
      seller_profile_id: "seller-1",
      vehicle_id: "vehicle-1",
      vehicle_title: "Volkswagen Golf 1.5 TSI",
    });
    expect(onMatchingBuyerSearch).toHaveBeenCalledWith({
      seller_profile_id: "seller-2",
      vehicle_id: "vehicle-2",
      vehicle_title: "Volkswagen Golf 1.5 TSI",
    });
  });
});
