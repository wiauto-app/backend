import { ListItem } from "../entities/list-item";
import { VehicleListDetailItem } from "../read-models/vehicle-list-detail";

export abstract class VehicleListItemRepository {
  abstract add(item: ListItem): Promise<ListItem>;
  abstract remove(list_id: string, vehicle_id: string): Promise<void>;
  abstract findAllByListId(list_id: string): Promise<VehicleListDetailItem[]>;
  abstract exists(list_id: string, vehicle_id: string): Promise<boolean>;
  abstract decrementFavoritesByListId(list_id: string): Promise<void>;
  abstract findProfileIdsByVehicleId(vehicle_id: string): Promise<string[]>;
  abstract findStaleFavoriteReminders(params: {
    older_than_days: number;
  }): Promise<Array<{ profile_id: string; vehicle_id: string; added_at: Date }>>;
}
