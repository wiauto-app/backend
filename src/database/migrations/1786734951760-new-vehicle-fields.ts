import { MigrationInterface, QueryRunner } from "typeorm";

export class NewVehicleFields1786734951760 implements MigrationInterface {
    name = 'NewVehicleFields1786734951760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "finance_price" numeric(2,1)`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "show_first_cuota" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "by_brand_warranty" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "show_exact_location" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."vehicles_publisher_type_enum" RENAME TO "vehicles_publisher_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_publisher_type_enum" AS ENUM('dealership', 'particular')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" TYPE "public"."vehicles_publisher_type_enum" USING "publisher_type"::"text"::"public"."vehicles_publisher_type_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_publisher_type_enum_old"`);
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
        await queryRunner.query(`CREATE TYPE "public"."vehicles_publisher_type_enum_old" AS ENUM('dealership', 'particular')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" TYPE "public"."vehicles_publisher_type_enum_old" USING "publisher_type"::"text"::"public"."vehicles_publisher_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_publisher_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."vehicles_publisher_type_enum_old" RENAME TO "vehicles_publisher_type_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "show_exact_location"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "by_brand_warranty"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "show_first_cuota"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "finance_price"`);
    }

}
