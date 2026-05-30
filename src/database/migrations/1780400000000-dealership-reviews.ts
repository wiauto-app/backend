import { MigrationInterface, QueryRunner } from "typeorm";

export class DealershipReviews1780400000000 implements MigrationInterface {
  name = "DealershipReviews1780400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "dealership_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rating" integer NOT NULL,
        "comment" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "profile_id" uuid NOT NULL,
        "dealership_id" uuid NOT NULL,
        CONSTRAINT "PK_dealership_reviews_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_dealership_reviews_dealership_id"
      ON "dealership_reviews" ("dealership_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "dealership_reviews"
      ADD CONSTRAINT "FK_dealership_reviews_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "dealership_reviews"
      ADD CONSTRAINT "FK_dealership_reviews_dealership_id"
      FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dealership_reviews" DROP CONSTRAINT "FK_dealership_reviews_dealership_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dealership_reviews" DROP CONSTRAINT "FK_dealership_reviews_profile_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_dealership_reviews_dealership_id"`);
    await queryRunner.query(`DROP TABLE "dealership_reviews"`);
  }
}
