import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Permissions } from "../entities/permissions.entity";
import { PERMISSIONS_CATALOG } from "../permissions.catalog";

@Injectable()
export class PermissionsCatalogSyncService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsCatalogSyncService.name);

  constructor(
    @InjectRepository(Permissions)
    private readonly permissions_repository: Repository<Permissions>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.syncFromCatalog();
    } catch (error) {
      this.logger.warn(
        `No se pudo sincronizar el catálogo de permisos al arrancar: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Upsert por `key`. No borra filas huérfanas (pueden tener FKs en roles_permissions).
   * Deja `value` en null: las cuotas ya no viven en el permiso.
   */
  async syncFromCatalog(): Promise<{ upserted: number }> {
    let upserted = 0;

    for (const definition of PERMISSIONS_CATALOG) {
      const existing = await this.permissions_repository.findOne({
        where: { key: definition.key },
        withDeleted: true,
      });

      if (!existing) {
        await this.permissions_repository.save(
          this.permissions_repository.create({
            key: definition.key,
            name: definition.name,
            value: null as unknown as undefined,
          }),
        );
        upserted += 1;
        continue;
      }

      const preloaded = await this.permissions_repository.preload({
        id: existing.id,
        name: definition.name,
        key: definition.key,
        value: null as unknown as undefined,
        deleted_at: null as unknown as undefined,
      });

      if (!preloaded) {
        continue;
      }

      await this.permissions_repository.save(preloaded);
      upserted += 1;
    }

    this.logger.log(`Catálogo de permisos sincronizado (${upserted} filas)`);
    return { upserted };
  }
}
