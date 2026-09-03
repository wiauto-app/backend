import { MigrationInterface, QueryRunner } from "typeorm";

export class RefOptional1788473872913 implements MigrationInterface {
    name = 'RefOptional1788473872913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "UQ_90bd206d5b617610bc1adda81b0"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "ref"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "ref" character varying`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "UQ_90bd206d5b617610bc1adda81b0" UNIQUE ("ref")`);
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
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "UQ_90bd206d5b617610bc1adda81b0"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "ref"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "ref" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "UQ_90bd206d5b617610bc1adda81b0" UNIQUE ("ref")`);
    }

}
