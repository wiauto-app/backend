import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleVideosFeatures1777136000898 implements MigrationInterface {
    name = 'VehicleVideosFeatures1777136000898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vehicle_videos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "status" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "vehicle_id" uuid NOT NULL, CONSTRAINT "PK_0c9684f2eeba412c750f29d0801" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "vehicle_id" character varying NOT NULL, CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicle_features" ("featuresId" uuid NOT NULL, "vehiclesId" uuid NOT NULL, CONSTRAINT "PK_5961599c7a8826c80cec99ba298" PRIMARY KEY ("featuresId", "vehiclesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_676ea8d79fa1a0828422202c24" ON "vehicle_features" ("featuresId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3f9508ea379ef90caec5d15938" ON "vehicle_features" ("vehiclesId") `);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_publisher_type_enum" AS ENUM('professional', 'particular')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "publisher_type" "public"."vehicles_publisher_type_enum" NOT NULL DEFAULT 'professional'`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "phone_code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "phone" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_videos" ADD CONSTRAINT "FK_7b924b07f47d593057c7edf6001" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_676ea8d79fa1a0828422202c242" FOREIGN KEY ("featuresId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_3f9508ea379ef90caec5d159382" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_3f9508ea379ef90caec5d159382"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_676ea8d79fa1a0828422202c242"`);
        await queryRunner.query(`ALTER TABLE "vehicle_videos" DROP CONSTRAINT "FK_7b924b07f47d593057c7edf6001"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "phone_code"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "publisher_type"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_publisher_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f9508ea379ef90caec5d15938"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_676ea8d79fa1a0828422202c24"`);
        await queryRunner.query(`DROP TABLE "vehicle_features"`);
        await queryRunner.query(`DROP TABLE "features"`);
        await queryRunner.query(`DROP TABLE "vehicle_videos"`);
    }

}
