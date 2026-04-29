import { MigrationInterface, QueryRunner } from "typeorm";
import { slugify } from "../../contexts/shared/slugify-string/slugify";

export class FeaturesSlug1778050000000 implements MigrationInterface {
  name = "FeaturesSlug1778050000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "features" ADD "slug" character varying`);
    const rows: { id: string; name: string }[] = await queryRunner.query(
      `SELECT "id", "name" FROM "features"`,
    );
    for (const row of rows) {
      await queryRunner.query(`UPDATE "features" SET "slug" = $1 WHERE "id" = $2`, [
        slugify(row.name),
        row.id,
      ]);
    }
    await queryRunner.query(
      `ALTER TABLE "features" ALTER COLUMN "slug" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "features" DROP COLUMN "slug"`);
  }
}
