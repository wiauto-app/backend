import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Repository } from "typeorm";

import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import { FindAllPermissionsDto } from "../dto/find-all-permissions.dto";
import { Permissions } from "../entities/permissions.entity";
import { build_available_permission_file_content } from "../lib/build-available-permission-source";
import {
  PERMISSIONS_CATALOG,
  PermissionDefinition,
} from "../permissions.catalog";
import { PermissionsCatalogSyncService } from "./permissions-catalog-sync.service";

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
    private readonly permissions_catalog_sync_service: PermissionsCatalogSyncService,
  ) {}

  async verifyExistence(key: string): Promise<void> {
    const existing_permission = await this.permissions_repository.find({
      where: { key },
    });
    if (existing_permission.length > 0) {
      throw new ConflictException("El permiso ya existe");
    }
  }

  /** Listado del catálogo hardcodeado (fuente de verdad). */
  listCatalog(): PermissionDefinition[] {
    return PERMISSIONS_CATALOG;
  }

  async create(): Promise<never> {
    throw new BadRequestException(
      "Los permisos son un catálogo fijo. Usa POST /v1/permissions/sync-catalog para sincronizar la base de datos.",
    );
  }

  async findAll(
    find_all_permissions_dto: FindAllPermissionsDto,
  ): Promise<PaginatedResult<Permissions>> {
    return runPaginatedTypeormFind({
      repository: this.permissions_repository,
      filter: find_all_permissions_dto,
      map_row: (row) => row,
      allowed_sort_keys: new Set(["name", "key", "created_at", "updated_at"]),
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<Permissions> {
    const permission = await this.permissions_repository.findOne({
      where: { id },
      relations: { roles_permissions: true },
    });
    if (!permission) {
      throw new NotFoundException("Permiso no encontrado");
    }
    return permission;
  }

  async update(): Promise<never> {
    throw new BadRequestException(
      "No se pueden editar permisos manualmente. El catálogo en código es la fuente de verdad; sincroniza con POST /v1/permissions/sync-catalog.",
    );
  }

  async remove(): Promise<never> {
    throw new BadRequestException(
      "No se pueden eliminar permisos del catálogo.",
    );
  }

  async syncCatalog(): Promise<{ upserted: number }> {
    return this.permissions_catalog_sync_service.syncFromCatalog();
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
    const output_path = path.join(
      process.cwd(),
      available_permission_file_relative,
    );
    await mkdir(path.dirname(output_path), { recursive: true });
    await writeFile(output_path, content, "utf8");
    return {
      output_path,
      keys_written: rows.filter((r) => r.key.trim()).length,
    };
  }
}
