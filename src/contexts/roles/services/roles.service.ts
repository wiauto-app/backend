import { BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Injectable } from "../../shared/dependency-injectable/injectable";
import { Permissions } from "../../users/permissions/entities/permissions.entity";
import { CreateRoleDto } from "../dto/create-role.dto";
import { Roles } from "../entities/roles.entity";
import { UpdateRoleDto } from "../dto/update-role.dto";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepository: Repository<Roles>,
    @InjectRepository(Permissions)
    private readonly permissionsRepository: Repository<Permissions>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = this.rolesRepository.create(createRoleDto)
    return await this.rolesRepository.save(role)
  }

  async findAll() {
    return await this.rolesRepository.find()
  }

  async findOne(id: string) {
    return await this.rolesRepository.findOne({ where: { id } })
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
      relations: { permissions: true },
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
    const role = await this.rolesRepository.findOne({
      where: { id: role_id },
      relations: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException("Rol no encontrado");
    }

    const unique_ids = [...new Set(permission_ids)];

    if (unique_ids.length === 0) {
      role.permissions = [];
      await this.rolesRepository.save(role);
    } else {
      const permissions = await this.permissionsRepository.find({
        where: { id: In(unique_ids) },
      });

      if (permissions.length !== unique_ids.length) {
        throw new BadRequestException(
          "Uno o más permission_ids no existen o están duplicados de forma inválida",
        );
      }

      role.permissions = permissions;
      await this.rolesRepository.save(role);
    }

    const updated = await this.rolesRepository.findOne({
      where: { id: role_id },
      relations: { permissions: true },
    });
    if (!updated) {
      throw new NotFoundException("Rol no encontrado");
    }
    return updated;
  }
}