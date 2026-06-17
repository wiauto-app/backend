import { CreateProfilePayload } from "./create-profile.payload";

export type UpdateProfilePayload = Partial<CreateProfilePayload> & { id: string, phone_code?: string, phone?: string, dni?: string, image_url?: string };
