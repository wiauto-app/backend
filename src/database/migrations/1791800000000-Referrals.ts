import { MigrationInterface, QueryRunner } from "typeorm";

export class Referrals1791800000000 implements MigrationInterface {
  name = "Referrals1791800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profile" ADD "referral_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile" ADD CONSTRAINT "UQ_profile_referral_code" UNIQUE ("referral_code")`,
    );

    await queryRunner.query(`
      CREATE TABLE "referrals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inviter_profile_id" uuid NOT NULL,
        "invitee_profile_id" uuid NOT NULL,
        "status" character varying NOT NULL,
        "rewarded_credit_id" uuid,
        "rewarded_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_referrals" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_referrals_inviter_profile_id" ON "referrals" ("inviter_profile_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_referrals_invitee_profile_id" ON "referrals" ("invitee_profile_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_referrals_inviter_profile" FOREIGN KEY ("inviter_profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_referrals_invitee_profile" FOREIGN KEY ("invitee_profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" ADD CONSTRAINT "FK_referrals_rewarded_credit" FOREIGN KEY ("rewarded_credit_id") REFERENCES "featured_listing_credits"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    const profiles = (await queryRunner.query(
      `SELECT "id" FROM "profile" WHERE "referral_code" IS NULL`,
    )) as { id: string }[];

    for (const profile of profiles) {
      let assigned = false;
      for (let attempt = 0; attempt < 12 && !assigned; attempt += 1) {
        const code = (
          await queryRunner.query(
            `SELECT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)) AS code`,
          )
        )[0]?.code as string;

        if (!code) {
          continue;
        }

        const conflict = (await queryRunner.query(
          `SELECT 1 FROM "profile" WHERE "referral_code" = $1 LIMIT 1`,
          [code],
        )) as unknown[];

        if (conflict.length > 0) {
          continue;
        }

        await queryRunner.query(
          `UPDATE "profile" SET "referral_code" = $1 WHERE "id" = $2`,
          [code, profile.id],
        );
        assigned = true;
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_referrals_rewarded_credit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_referrals_invitee_profile"`,
    );
    await queryRunner.query(
      `ALTER TABLE "referrals" DROP CONSTRAINT "FK_referrals_inviter_profile"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_referrals_invitee_profile_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_referrals_inviter_profile_id"`);
    await queryRunner.query(`DROP TABLE "referrals"`);
    await queryRunner.query(
      `ALTER TABLE "profile" DROP CONSTRAINT "UQ_profile_referral_code"`,
    );
    await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "referral_code"`);
  }
}
