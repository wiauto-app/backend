import { BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { Injectable } from "../../shared/dependency-injectable/injectable";
import { Permissions } from "../../users/permissions/entities/permissions.entity";
import { RolesPermissionsEntity } from "../../users/roles-permissions/entities/roles-permissions.entity";
import { CreateRoleDto } from "../dto/create-role.dto";
import { Roles } from "../entities/roles.entity";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { FindAllRolesDto } from "../dto/find-all-roles.dto";
import { runPaginatedTypeormFind } from "../../shared/infrastructure/typeorm/run-paginated-typeorm-find";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    @InjectRepository(Permissions)
    private readonly permissionsRepository: Repository<Permissions>,
    private readonly dataSource: DataSource,
  ) { }

  async create(createRoleDto: CreateRoleDto) {
    const role = this.rolesRepository.create(createRoleDto)
    return await this.rolesRepository.save(role)
  }

  async findAll(findAllRolesDto: FindAllRolesDto) {
    const result = await runPaginatedTypeormFind({
      repository: this.rolesRepository,
      filter: findAllRolesDto,
      map_row: (row) => row,
      allowed_sort_keys: new Set(["name", "is_admin", "is_developer", "created_at", "updated_at"]),
      default_sort_key: "name",
      relations: ["roles_permissions", "roles_permissions.permission"],
    })
    return result
  }

  async findOne(id: string) {
    return await this.rolesRepository.findOne({
      where: { id }, relations: {
        roles_permissions: {
          permission: true
        },
      }
    })
  }

  async findDefault() {
    return await this.rolesRepository.findOne({ where: { is_default: true } })
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.rolesRepository.preload({ id, ...updateRoleDto })
    if (!role) {
      throw new NotFoundException('Role not found')
    }
    return await this.rolesRepository.save(role)
  }

  async remove(id: string) {
    return await this.rolesRepository.softDelete(id)
  }

  async findOneWithPermissions(id: string) {
    return await this.rolesRepository.findOne({
      where: { id },
      relations: { roles_permissions: true },
    });
  }

  /**
   * Reemplaza los permisos del rol por el conjunto indicado (IDs únicos).
   * `permission_ids` vacío elimina todos los permisos del rol.
   */
  async assign_permissions(
    role_id: string,
    permission_ids: string[],
  ): Promise<Roles> {
    const roleExists = await this.rolesRepository.exists({
      where: { id: role_id },
    });
    if (!roleExists) {
      throw new NotFoundException("Rol no encontrado");
    }

    const unique_ids = [...new Set(permission_ids)];

    if (unique_ids.length > 0) {
      const permissions = await this.permissionsRepository.find({
        where: { id: In(unique_ids) },
      });

      if (permissions.length !== unique_ids.length) {
        throw new BadRequestException(
          "Uno o más permission_ids no existen o están duplicados de forma inválida",
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RolesPermissionsEntity);

      const currentPermissions = await repository.find({
        where: { role_id },
        select: { permission_id: true },
      });

      const currentPermissionIds = currentPermissions.map(
        (permission) => permission.permission_id,
      );

      const toAdd = unique_ids.filter(
        (permissionId) => !currentPermissionIds.includes(permissionId),
      );

      const toRemove = currentPermissionIds.filter(
        (permissionId) => !unique_ids.includes(permissionId),
      );

      if (toAdd.length > 0) {
        await repository.insert(
          toAdd.map((permission_id) => ({
            role_id,
            permission_id,
          })),
        );
      }

      if (toRemove.length > 0) {
        await repository.delete({
          role_id,
          permission_id: In(toRemove),
        });
      }
    });

    const updated = await this.rolesRepository.findOne({
      where: { id: role_id },
      relations: { roles_permissions: true },
    });
    if (!updated) {
      throw new NotFoundException("Rol no encontrado");
    }
    return updated;
  }
}