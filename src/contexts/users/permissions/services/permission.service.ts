import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Repository } from "typeorm";
import { build_available_permission_file_content } from "../lib/build-available-permission-source";
import { CreatePermissionDto } from "../dto/create-permission.dto";
import { UpdatePermissionDto } from "../dto/update-permission.dto";
import { Permissions } from "../entities/permissions.entity";

const available_permission_file_relative = path.join(
  "src",
  "contexts",
  "users",
  "permissions",
  "lib",
  "available-permission.ts",
);

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permissions)
    private readonly permissions_repository: Repository<Permissions>,
  ) { }


  async verifyExistence(key: string, value?: number): Promise<void> {
    const existing_permission = await this.permissions_repository.find({
      where: { key, value },
    });
    if (existing_permission.length > 0) {
      throw new ConflictException("El permiso ya existe");
    }
  }

  async create(create_permission_dto: CreatePermissionDto): Promise<Permissions> {

    await this.verifyExistence(create_permission_dto.key, create_permission_dto.value);
    const permission = this.permissions_repository.create(create_permission_dto);
    return await this.permissions_repository.save(permission);
  }

  async findAll(): Promise<Permissions[]> {
    return await this.permissions_repository.find({
      order: { key: "ASC" },
    });
  }

  async findOne(id: string): Promise<Permissions> {
    const permission = await this.permissions_repository.findOne({
      where: { id },
      relations: { roles: true },
    });
    if (!permission) {
      throw new NotFoundException("Permiso no encontrado");
    }
    return permission;
  }

  async update(
    id: string,
    update_permission_dto: UpdatePermissionDto,
  ): Promise<Permissions> {
    if (update_permission_dto.key) {
      await this.verifyExistence(update_permission_dto.key, update_permission_dto.value);
    }
    const permission = await this.permissions_repository.preload({
      id,
      ...update_permission_dto,
    });
    if (!permission) {
      throw new NotFoundException("Permiso no encontrado");
    }
    return await this.permissions_repository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const result = await this.permissions_repository.softDelete(id);
    if (!result.affected) {
      throw new NotFoundException("Permiso no encontrado");
    }
  }

  /**
   * Lee las `key` activas en BD y escribe `lib/available-permission.ts`
   * con `export const PermissionKeys = { … } as const`.
   */
  async sync_available_permission_keys_file(): Promise<{
    output_path: string;
    keys_written: number;
  }> {
    const rows = await this.permissions_repository.find({
      select: { key: true },
      order: { key: "ASC" },
    });
    const content = build_available_permission_file_content(rows);
    const output_path = path.join(process.cwd(), available_permission_file_relative);
    await mkdir(path.dirname(output_path), { recursive: true });
    await writeFile(output_path, content, "utf8");
    return {
      output_path,
      keys_written: rows.filter((r) => r.key.trim()).length,
    };
  }
}
