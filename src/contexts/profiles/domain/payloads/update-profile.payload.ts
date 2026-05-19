import { CreateProfilePayload } from "./create-profile.payload";

export type UpdateProfilePayload = Partial<CreateProfilePayload> & { id: string };
