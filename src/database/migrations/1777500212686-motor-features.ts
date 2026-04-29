import { MigrationInterface, QueryRunner } from "typeorm";

export class MotorFeatures1777500212686 implements MigrationInterface {
    name = 'MotorFeatures1777500212686'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_color_id"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_dgt_label_id"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_vehicle_type_id"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_warranty_type_id"`);
        await queryRunner.query(`ALTER TABLE "vehicle_services" DROP CONSTRAINT "FK_vehicle_services_servicesId"`);
        await queryRunner.query(`ALTER TABLE "vehicle_services" DROP CONSTRAINT "FK_vehicle_services_vehiclesId"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_version_external_trim_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_services_servicesId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vehicle_services_vehiclesId"`);
        await queryRunner.query(`CREATE TABLE "tractions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_81cac675c892e52b91e0d32ada8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "version" DROP COLUMN "external_trim_id"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_transmission_type_enum" AS ENUM('manual', 'automatic')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "transmission_type" "public"."vehicles_transmission_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "traction_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "autonomy" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "battery_capacity" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "time_to_charge" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "power" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "displacement" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "license_plate" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_ce15f27dc7d89cd272e6545d26" ON "vehicle_services" ("vehiclesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_879e0992af020c57666c2c02d1" ON "vehicle_services" ("servicesId") `);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_a68eca87181ccede03291b39aab" FOREIGN KEY ("traction_id") REFERENCES "tractions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_8c6922f37d6f8a496a4cabfe080" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_b78dc0cd6578bd8340b7adb2b05" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_091936a2c2f5cedc441bdbb616d" FOREIGN KEY ("dgt_label_id") REFERENCES "dgt_labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_266824f2c93bbbdb7de7edeae32" FOREIGN KEY ("warranty_type_id") REFERENCES "warranty_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle_services" ADD CONSTRAINT "FK_ce15f27dc7d89cd272e6545d263" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_services" ADD CONSTRAINT "FK_879e0992af020c57666c2c02d10" FOREIGN KEY ("servicesId") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_services" DROP CONSTRAINT "FK_879e0992af020c57666c2c02d10"`);
        await queryRunner.query(`ALTER TABLE "vehicle_services" DROP CONSTRAINT "FK_ce15f27dc7d89cd272e6545d263"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_266824f2c93bbbdb7de7edeae32"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_091936a2c2f5cedc441bdbb616d"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_b78dc0cd6578bd8340b7adb2b05"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_8c6922f37d6f8a496a4cabfe080"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_a68eca87181ccede03291b39aab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_879e0992af020c57666c2c02d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ce15f27dc7d89cd272e6545d26"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "license_plate"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "displacement"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "power"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "time_to_charge"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "battery_capacity"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "autonomy"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "traction_id"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "transmission_type"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_transmission_type_enum"`);
        await queryRunner.query(`ALTER TABLE "version" ADD "external_trim_id" integer`);
        await queryRunner.query(`DROP TABLE "tractions"`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_services_vehiclesId" ON "vehicle_services" ("vehiclesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_services_servicesId" ON "vehicle_services" ("servicesId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_version_external_trim_id" ON "version" ("external_trim_id") WHERE (external_trim_id IS NOT NULL)`);
        await queryRunner.query(`ALTER TABLE "vehicle_services" ADD CONSTRAINT "FK_vehicle_services_vehiclesId" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle_services" ADD CONSTRAINT "FK_vehicle_services_servicesId" FOREIGN KEY ("servicesId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_warranty_type_id" FOREIGN KEY ("warranty_type_id") REFERENCES "warranty_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_vehicle_type_id" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_dgt_label_id" FOREIGN KEY ("dgt_label_id") REFERENCES "dgt_labels"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_color_id" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
