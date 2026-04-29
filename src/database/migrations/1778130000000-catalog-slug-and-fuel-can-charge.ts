import { MigrationInterface, QueryRunner } from "typeorm";

export class CatalogSlugAndFuelCanCharge1778130000000 implements MigrationInterface {
  name = "CatalogSlugAndFuelCanCharge1778130000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "make" ADD "slug" character varying`);
    await queryRunner.query(
      `UPDATE "make" SET "slug" = 'make-' || id::text WHERE "slug" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "make" ALTER COLUMN "slug" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "year" ADD "slug" character varying`);
    await queryRunner.query(
      `UPDATE "year" SET "slug" = year::text WHERE "slug" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "year" ALTER COLUMN "slug" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "body_type" ADD "slug" character varying`);
    await queryRunner.query(
      `UPDATE "body_type" SET "slug" = 'body-type-' || id::text WHERE "slug" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "body_type" ALTER COLUMN "slug" SET NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "fuel_type" ADD "slug" character varying`);
    await queryRunner.query(
      `ALTER TABLE "fuel_type" ADD "can_charge" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "fuel_type" SET "slug" = 'fuel-type-' || id::text WHERE "slug" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "fuel_type" ALTER COLUMN "slug" SET NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "model" ADD "slug" character varying`);
    await queryRunner.query(
      `UPDATE "model" SET "slug" = 'model-' || id::text WHERE "slug" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "model" ALTER COLUMN "slug" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "version" ADD "slug" character varying`);
    await queryRunner.query(
      `UPDATE "version" SET "slug" = 'version-' || id::text WHERE "slug" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "version" ALTER COLUMN "slug" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "version" DROP COLUMN "slug"`);
    await queryRunner.query(`ALTER TABLE "model" DROP COLUMN "slug"`);
    await queryRunner.query(`ALTER TABLE "fuel_type" DROP COLUMN "can_charge"`);
    await queryRunner.query(`ALTER TABLE "fuel_type" DROP COLUMN "slug"`);
    await queryRunner.query(`ALTER TABLE "body_type" DROP COLUMN "slug"`);
    await queryRunner.query(`ALTER TABLE "year" DROP COLUMN "slug"`);
    await queryRunner.query(`ALTER TABLE "make" DROP COLUMN "slug"`);
  }
}
