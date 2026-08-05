import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNewsletterSubscriptions1786200000000
  implements MigrationInterface
{
  name = "CreateNewsletterSubscriptions1786200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "newsletter_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "profile_id" uuid,
        "enabled_category_slugs" text array NOT NULL DEFAULT '{}',
        "channel_email" boolean NOT NULL DEFAULT true,
        "channel_push" boolean NOT NULL DEFAULT true,
        "channel_in_app" boolean NOT NULL DEFAULT true,
        "channel_whatsapp" boolean NOT NULL DEFAULT false,
        "channel_sms" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_newsletter_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_newsletter_subscriptions_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "newsletter_subscriptions"
      ADD CONSTRAINT "FK_newsletter_subscriptions_profile_id"
      FOREIGN KEY ("profile_id") REFERENCES "profile"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "newsletter_subscriptions"
      DROP CONSTRAINT "FK_newsletter_subscriptions_profile_id"
    `);
    await queryRunner.query(`DROP TABLE "newsletter_subscriptions"`);
  }
}
