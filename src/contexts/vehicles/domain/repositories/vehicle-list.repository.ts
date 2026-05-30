import { List } from "../entities/list";
import { VehicleListDetail } from "../read-models/vehicle-list-detail";

export abstract class VehicleListRepository {
  abstract save(list: List): Promise<List>;
  abstract update(list: List): Promise<void>;
  abstract findOne(id: string): Promise<List | null>;
  abstract findAllByProfileId(profile_id: string): Promise<List[]>;
  abstract delete(id: string): Promise<void>;
  abstract clearDefaultForProfile(profile_id: string): Promise<void>;
  abstract countByProfileId(profile_id: string): Promise<number>;
  abstract findOneWithDetail(id: string): Promise<VehicleListDetail | null>;
}
