import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeaturesToFeaturedListingOffers1790391501511
  implements MigrationInterface
{
  name = "AddFeaturesToFeaturedListingOffers1790391501511";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "featured_listing_offers" ADD "features" text array NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "featured_listing_offers" DROP COLUMN "features"`,
    );
  }
}
