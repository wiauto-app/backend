import { MigrationInterface, QueryRunner } from "typeorm";

export class DealershipFeaturedRating1781400000000 implements MigrationInterface {
  name = "DealershipFeaturedRating1781400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dealerships" ADD "is_featured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "dealerships" ADD "rating" numeric(3,2)`,
    );
    await queryRunner.query(`
      UPDATE "dealerships" d
      SET "rating" = sub.avg_rating
      FROM (
        SELECT dealership_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating
        FROM dealership_reviews
        GROUP BY dealership_id
      ) sub
      WHERE d.id = sub.dealership_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dealerships" DROP COLUMN "rating"`);
    await queryRunner.query(`ALTER TABLE "dealerships" DROP COLUMN "is_featured"`);
  }
}
