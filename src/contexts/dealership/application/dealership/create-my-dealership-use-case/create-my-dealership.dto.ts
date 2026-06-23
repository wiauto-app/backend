import { CreateDealershipDto } from "../create-dealership-use-case/create-dealership.dto";

export type CreateMyDealershipDto = Omit<CreateDealershipDto, "members">;
