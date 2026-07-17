import { PartialType } from "@nestjs/mapped-types";

import { CreateProfileHttpDto } from "../create-profile/create-profile.http-dto";

export class UpdateProfileHttpDto extends PartialType(CreateProfileHttpDto) {}
