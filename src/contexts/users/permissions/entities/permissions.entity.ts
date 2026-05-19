import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { RolesPermissionsEntity } from "../../roles-permissions/entities/roles-permissions.entity";


@Entity("permissions")
export class Permissions {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  key: string;
  
  @Column({ type: "int", nullable: true })
  value?:number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  @OneToMany(() => RolesPermissionsEntity, (roles_permissions) => roles_permissions.permission)
  roles_permissions: Relation<RolesPermissionsEntity[]>;
}