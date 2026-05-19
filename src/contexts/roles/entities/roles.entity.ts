import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";
import { RolesPermissionsEntity } from "../../users/roles-permissions/entities/roles-permissions.entity";

@Entity('roles')
export class Roles {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  is_admin: boolean;

  @Column()
  is_developer: boolean;

  @Column({ default: false })
  is_default: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ select: false })
  deleted_at?: Date;

  // @Column({ nullable: true })
  // premium_url?: string;  

  @OneToMany(() => ProfileEntity, (profile) => profile.role)
  profiles: Relation<ProfileEntity[]>;

  @OneToMany(() => RolesPermissionsEntity, (roles_permissions) => roles_permissions.role)
  roles_permissions: Relation<RolesPermissionsEntity[]>;
}