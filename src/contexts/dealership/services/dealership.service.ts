import { ConflictException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { RemoveFilesService } from "@/src/contexts/shared/file/services/remove-files.service";
import { STORAGE_DIRECTORIES } from "@/src/contexts/shared/file/storage-directories";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";

import { Dealership, PrimitiveDealership } from "../types/dealership";
import { DealershipNotFoundException } from "../exceptions/dealership-not-found.exception";
import { DealershipsFilter } from "../types/dealerships.filter";
import { CreateDealershipPayload } from "../types/create-dealership.payload";
import { UpdateDealershipPayload } from "../types/update-dealership.payload";
import { DealershipAdminList } from "../types/dealership-admin-list";
import { DealershipDetail } from "../types/dealership-detail";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { TypeOrmDealershipRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-repository";
import { CreateDealershipDto } from "../dto/create-dealership.dto";
import { CreateMyDealershipDto } from "../dto/create-my-dealership.dto";
import { FindAllDealershipDto } from "../dto/find-all-dealership.dto";
import { FindOneDealershipBySlugDto } from "../dto/find-one-dealership-by-slug.dto";
import { FindOneDealershipDto } from "../dto/find-one-dealership.dto";
import { RemoveDealershipDto } from "../dto/remove-dealership.dto";
import { UpdateDealershipDto } from "../dto/update-dealership.dto";
import { DealershipMembersService } from "./dealership-members.service";
import { DealershipScheduleService } from "./dealership-schedule.service";

@Injectable()
export class DealershipService {
  constructor(
    private readonly dealership_repository: TypeOrmDealershipRepository,
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    private readonly dealership_members_service: DealershipMembersService,
    private readonly dealership_schedule_service: DealershipScheduleService,
    private readonly remove_image_service: RemoveFilesService,
  ) {}

  async create(
    create_dealership_dto: CreateDealershipDto,
  ): Promise<PrimitiveDealership> {
    const payload = await this.toCreatePayload(create_dealership_dto);
    const dealership = Dealership.create(payload);
    await this.dealership_repository.save(dealership);

    await this.dealership_members_service.sync({
      dealership_id: dealership.toPrimitives().id,
      members: create_dealership_dto.members,
    });

    return dealership.toPrimitives();
  }

  async createMy(
    profile_id: string,
    create_my_dealership_dto: CreateMyDealershipDto,
  ): Promise<PrimitiveDealership> {
    const existing_membership =
      await this.dealership_member_repository.findOneByProfileId(profile_id);

    if (existing_membership) {
      throw new ConflictException("Ya perteneces a una concesionaria");
    }

    return this.create({
      ...create_my_dealership_dto,
      members: [{ profile_id, role: "owner" }],
    });
  }

  async findAll(
    find_all_dealership_dto: FindAllDealershipDto,
  ): Promise<PaginatedResult<DealershipAdminList>> {
    const filter = new DealershipsFilter({ ...find_all_dealership_dto });
    return this.dealership_repository.findAll(filter);
  }

  async findOne(
    find_one_dealership_dto: FindOneDealershipDto,
  ): Promise<DealershipDetail> {
    const dealership = await this.dealership_repository.findOne(
      find_one_dealership_dto.id,
    );
    if (!dealership) {
      throw new DealershipNotFoundException(find_one_dealership_dto.id);
    }

    const members =
      await this.dealership_member_repository.findAllByDealershipId(
        find_one_dealership_dto.id,
      );
    const schedules =
      await this.dealership_schedule_service.findByDealershipId(
        find_one_dealership_dto.id,
      );

    return {
      ...dealership.toPrimitives(),
      members,
      schedules,
    };
  }

  async findOneBySlug(
    find_one_dealership_by_slug_dto: FindOneDealershipBySlugDto,
  ): Promise<DealershipDetail> {
    const dealership = await this.dealership_repository.findOneBySlug(
      find_one_dealership_by_slug_dto.slug,
    );
    if (!dealership) {
      throw new DealershipNotFoundException(
        find_one_dealership_by_slug_dto.slug,
      );
    }

    const primitives = dealership.toPrimitives();
    const members =
      await this.dealership_member_repository.findAllByDealershipId(
        primitives.id,
      );
    const schedules =
      await this.dealership_schedule_service.findByDealershipId(primitives.id);

    const should_hide_phone = primitives.show_phone === false;

    return {
      ...primitives,
      phone: should_hide_phone ? "" : primitives.phone,
      phone_code: should_hide_phone ? "" : primitives.phone_code,
      members,
      schedules,
    };
  }

  async update(
    update_dealership_dto: UpdateDealershipDto,
  ): Promise<PrimitiveDealership> {
    const { id, members, ...patch_fields } = update_dealership_dto;
    const dealership = await this.dealership_repository.findOne(id);
    if (!dealership) {
      throw new DealershipNotFoundException(id);
    }

    const payload: UpdateDealershipPayload = { ...patch_fields };

    if (patch_fields.name !== undefined) {
      payload.slug = await this.buildUniqueSlug(patch_fields.name, id);
    }

    const updated = dealership.update(payload);
    await this.dealership_repository.update(updated);

    if (members !== undefined) {
      await this.dealership_members_service.sync({
        dealership_id: id,
        members,
      });
    }

    return updated.toPrimitives();
  }

  async remove(remove_dealership_dto: RemoveDealershipDto): Promise<void> {
    const dealership = await this.dealership_repository
      .findOne(remove_dealership_dto.id)
      .then((row) => row?.toPrimitives());
    if (!dealership) {
      throw new DealershipNotFoundException(remove_dealership_dto.id);
    }

    const directory = STORAGE_DIRECTORIES.DEALERSHIP_IMAGES;
    const images = [
      dealership.avatar_url ? `/${dealership.avatar_url}` : undefined,
      dealership.banner_url ? `/${dealership.banner_url}` : undefined].filter((image) => image !== undefined);
    const formated_images = images
      .filter(Boolean)
      .map((url) =>
        url
          .replace(/^\/+/, "")
          .replace(`${directory}/`, ""),
      );
    await this.remove_image_service.execute({
      paths: formated_images,
      bucket_name: directory,
    });

    await this.dealership_repository.delete(remove_dealership_dto.id);
  }

  private async buildUniqueSlug(
    name: string,
    exclude_id?: string,
  ): Promise<string> {
    const base = slugify(name) || "concesionaria";
    let candidate = base;
    let suffix = 2;

    while (true) {
      const existing =
        await this.dealership_repository.findOneBySlug(candidate);
      if (!existing) {
        return candidate;
      }

      if (exclude_id && existing.toPrimitives().id === exclude_id) {
        return candidate;
      }

      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
  }

  private async toCreatePayload(
    dto: CreateDealershipDto,
  ): Promise<CreateDealershipPayload> {
    const payload = new CreateDealershipPayload();
    payload.name = dto.name;
    payload.slug = await this.buildUniqueSlug(dto.name);
    payload.avatar_url = dto.avatar_url;
    payload.banner_url = dto.banner_url;
    payload.description = dto.description;
    payload.website_url = dto.website_url;
    payload.email = dto.email;
    payload.phone_code = dto.phone_code;
    payload.phone = dto.phone;
    payload.address = dto.address;
    payload.lat = dto.lat;
    payload.lng = dto.lng;
    payload.show_phone = dto.show_phone;
    payload.max_listings = dto.max_listings;
    payload.max_photos = dto.max_photos;
    payload.allow_videos = dto.allow_videos;
    return payload;
  }
}
