import { CreateProfilePayload } from "./create-profile.payload";

export type UpdateProfilePayload = Partial<Omit<CreateProfilePayload, "id">>;
