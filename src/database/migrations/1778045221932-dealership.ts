import { MigrationInterface, QueryRunner } from "typeorm";

export class Dealership1778045221932 implements MigrationInterface {
    name = 'Dealership1778045221932'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_cuotas" DROP CONSTRAINT "FK_vehicle_cuotas_cuota"`);
        await queryRunner.query(`ALTER TABLE "vehicle_cuotas" DROP CONSTRAINT "FK_vehicle_cuotas_vehicle"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_cuotas_vehicle_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_cuotas_cuota_id"`);
        await queryRunner.query(`CREATE TABLE "dealerships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "avatar_url" character varying, "banner_url" character varying, "description" character varying NOT NULL, "website_url" character varying, "email" character varying NOT NULL, "phone_code" character varying NOT NULL, "phone" character varying NOT NULL, "address" character varying NOT NULL, "lat" numeric(10,8), "lng" numeric(11,8), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d0437fe70985654646502a6c805" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dealership_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dealership_id" uuid NOT NULL, "profile_id" uuid NOT NULL, "role" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4d7b007b1f0ed20509cab06617" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_74f817919723238d6cb8a5ede8" ON "vehicle_cuotas" ("vehicle_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c12c71890131b564fde48009b4" ON "vehicle_cuotas" ("cuota_id") `);
        await queryRunner.query(`ALTER TABLE "dealership_members" ADD CONSTRAINT "FK_86407af303b599a664627d41425" FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dealership_members" ADD CONSTRAINT "FK_5f1f981601c71a3d7d6c3dc831a" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle_cuotas" ADD CONSTRAINT "FK_74f817919723238d6cb8a5ede83" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_cuotas" ADD CONSTRAINT "FK_c12c71890131b564fde48009b4d" FOREIGN KEY ("cuota_id") REFERENCES "cuotas"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_cuotas" DROP CONSTRAINT "FK_c12c71890131b564fde48009b4d"`);
        await queryRunner.query(`ALTER TABLE "vehicle_cuotas" DROP CONSTRAINT "FK_74f817919723238d6cb8a5ede83"`);
        await queryRunner.query(`ALTER TABLE "dealership_members" DROP CONSTRAINT "FK_5f1f981601c71a3d7d6c3dc831a"`);
        await queryRunner.query(`ALTER TABLE "dealership_members" DROP CONSTRAINT "FK_86407af303b599a664627d41425"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c12c71890131b564fde48009b4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_74f817919723238d6cb8a5ede8"`);
        await queryRunner.query(`DROP TABLE "dealership_members"`);
        await queryRunner.query(`DROP TABLE "dealerships"`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_cuotas_cuota_id" ON "vehicle_cuotas" ("cuota_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_cuotas_vehicle_id" ON "vehicle_cuotas" ("vehicle_id") `);
        await queryRunner.query(`ALTER TABLE "vehicle_cuotas" ADD CONSTRAINT "FK_vehicle_cuotas_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle_cuotas" ADD CONSTRAINT "FK_vehicle_cuotas_cuota" FOREIGN KEY ("cuota_id") REFERENCES "cuotas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
