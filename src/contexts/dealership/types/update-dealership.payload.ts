import { CreateDealershipPayload } from "./create-dealership.payload";

export type UpdateDealershipPayload = Partial<CreateDealershipPayload> & {
  is_featured?: boolean;
  show_phone?: boolean;
};
