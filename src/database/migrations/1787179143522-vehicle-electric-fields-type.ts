import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleElectricFieldsType1787179143522 implements MigrationInterface {
    name = 'VehicleElectricFieldsType1787179143522'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."vehicles_publisher_type_enum" RENAME TO "vehicles_publisher_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_publisher_type_enum" AS ENUM('dealership', 'particular')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" TYPE "public"."vehicles_publisher_type_enum" USING "publisher_type"::"text"::"public"."vehicles_publisher_type_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_publisher_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "autonomy"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "autonomy" double precision`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "battery_capacity"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "battery_capacity" double precision`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "time_to_charge"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "time_to_charge" double precision`);
        await queryRunner.query(`ALTER TYPE "public"."profile_type_enum" RENAME TO "profile_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."profile_type_enum" AS ENUM('professional', 'particular')`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" TYPE "public"."profile_type_enum" USING "type"::"text"::"public"."profile_type_enum"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."profile_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."profile_type_enum_old" AS ENUM('professional', 'particular')`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" TYPE "public"."profile_type_enum_old" USING "type"::"text"::"public"."profile_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."profile_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."profile_type_enum_old" RENAME TO "profile_type_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "time_to_charge"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "time_to_charge" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "battery_capacity"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "battery_capacity" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "autonomy"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "autonomy" integer NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_publisher_type_enum_old" AS ENUM('dealership', 'particular')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" TYPE "public"."vehicles_publisher_type_enum_old" USING "publisher_type"::"text"::"public"."vehicles_publisher_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_publisher_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."vehicles_publisher_type_enum_old" RENAME TO "vehicles_publisher_type_enum"`);
    }

}
