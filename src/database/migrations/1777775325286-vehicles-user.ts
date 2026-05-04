import { MigrationInterface, QueryRunner } from "typeorm";

export class VehiclesUser1777775325286 implements MigrationInterface {
    name = 'VehiclesUser1777775325286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_cuota"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_cuotas_slug"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_provinces_slug"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_municipalities_slug"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_communities_slug"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "profile_id" uuid`);
        await queryRunner.query(`ALTER TABLE "cuotas" ADD CONSTRAINT "UQ_c383a07765e3d662f95c03c6d99" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "cuotas" ALTER COLUMN "value" DROP DEFAULT`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d9bd798de5f037f71e348d47f8" ON "provinces" ("slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_69b63b81836ddc1c3e9c31a50f" ON "municipalities" ("slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_42d5225a80ac87aa1254dfe282" ON "communities" ("slug") `);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_5a8c19d41ce734650879f5ab23a" FOREIGN KEY ("cuota_id") REFERENCES "cuotas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_e0bb01d7655ad76dafdf0f674b2" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_e0bb01d7655ad76dafdf0f674b2"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_5a8c19d41ce734650879f5ab23a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_42d5225a80ac87aa1254dfe282"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_69b63b81836ddc1c3e9c31a50f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d9bd798de5f037f71e348d47f8"`);
        await queryRunner.query(`ALTER TABLE "cuotas" ALTER COLUMN "value" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "cuotas" DROP CONSTRAINT "UQ_c383a07765e3d662f95c03c6d99"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "profile_id"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_communities_slug" ON "communities" ("slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_municipalities_slug" ON "municipalities" ("slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_provinces_slug" ON "provinces" ("slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_cuotas_slug" ON "cuotas" ("slug") `);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_cuota" FOREIGN KEY ("cuota_id") REFERENCES "cuotas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
