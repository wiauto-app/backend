import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, Relation, UpdateDateColumn } from "typeorm";
import { Permissions } from "../../permissions/entities/permissions.entity";

@Entity('roles_permissions')
export class RolesPermissionsEntity {

  @PrimaryColumn("uuid")
  role_id: string;

  @PrimaryColumn("uuid")
  permission_id: string;

  @ManyToOne(() => Roles, (role) => role.roles_permissions)
  @JoinColumn({ name: "role_id" })
  role: Relation<Roles>;

  @ManyToOne(() => Permissions, (permission) => permission.roles_permissions)
  @JoinColumn({ name: "permission_id" })
  permission: Relation<Permissions>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}