import { MigrationInterface, QueryRunner } from "typeorm";

export class NewTablesNames1776952469180 implements MigrationInterface {
    name = 'NewTablesNames1776952469180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Nombres antiguos (TypeORM por defecto). Orden: hija → padre.
        await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_images_entity" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_entity" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."vehicle_entity_status_enum" CASCADE`);
        // Si un intento previo dejó creadas `vehicles` / `vehicle_images` sin quitar las antiguas, evitar "already exists" al re-ejecutar.
        await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_images" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "vehicles" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."vehicles_status_enum" CASCADE`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_status_enum" AS ENUM('active', 'pending', 'inactive', 'sold', 'archived')`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "price" integer NOT NULL, "mileage" integer NOT NULL, "lat" numeric(10,8) NOT NULL, "lng" numeric(11,8) NOT NULL, "condition" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "status" "public"."vehicles_status_enum" NOT NULL DEFAULT 'pending', "is_featured" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP NOT NULL, "views" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "version_id" integer NOT NULL, CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicle_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "vehicle_id" uuid, CONSTRAINT "PK_62a037bce2dae7af30fc41cc984" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_8ca9da8d8e9188572e6a2e53fce" FOREIGN KEY ("version_id") REFERENCES "version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ADD CONSTRAINT "FK_0fcb9e0a442f0789daf320ccc1f" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_images" DROP CONSTRAINT "FK_0fcb9e0a442f0789daf320ccc1f"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_8ca9da8d8e9188572e6a2e53fce"`);
        await queryRunner.query(`DROP TABLE "vehicle_images"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_status_enum"`);
    }

}
