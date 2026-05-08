export class CreateProfileDto {
  id: string;
  name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  role_id?: string | null;
}
