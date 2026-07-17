import { CreateDealershipDto } from "./create-dealership.dto";

export type CreateMyDealershipDto = Omit<CreateDealershipDto, "members">;
