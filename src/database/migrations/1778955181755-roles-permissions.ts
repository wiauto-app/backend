import { MigrationInterface, QueryRunner } from "typeorm";

export class RolesPermissions1778955181755 implements MigrationInterface {
    name = 'RolesPermissions1778955181755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_bf98d8fd47610db71dfc5a4a5ff"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_f25fd350775094ceb3a02c14681"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f25fd350775094ceb3a02c1468"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf98d8fd47610db71dfc5a4a5f"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "PK_f8e26259e2114a037f1180ec0d8"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "PK_bf98d8fd47610db71dfc5a4a5ff" PRIMARY KEY ("rolesId")`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP COLUMN "permissionsId"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "PK_bf98d8fd47610db71dfc5a4a5ff"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP COLUMN "rolesId"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "PK_298f2c0e2ea45289aa0c4ac8a02" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD "role_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD "permission_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_7d2dad9f14eddeb09c256fea719" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_337aa8dba227a1fe6b73998307b" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_337aa8dba227a1fe6b73998307b"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_7d2dad9f14eddeb09c256fea719"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP COLUMN "permission_id"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP COLUMN "role_id"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "PK_298f2c0e2ea45289aa0c4ac8a02"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD "rolesId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "PK_bf98d8fd47610db71dfc5a4a5ff" PRIMARY KEY ("rolesId")`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD "permissionsId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "PK_bf98d8fd47610db71dfc5a4a5ff"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "PK_f8e26259e2114a037f1180ec0d8" PRIMARY KEY ("permissionsId", "rolesId")`);
        await queryRunner.query(`CREATE INDEX "IDX_bf98d8fd47610db71dfc5a4a5f" ON "roles_permissions" ("rolesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f25fd350775094ceb3a02c1468" ON "roles_permissions" ("permissionsId") `);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_f25fd350775094ceb3a02c14681" FOREIGN KEY ("permissionsId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_bf98d8fd47610db71dfc5a4a5ff" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
