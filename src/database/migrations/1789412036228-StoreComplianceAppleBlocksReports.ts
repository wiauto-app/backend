import { MigrationInterface, QueryRunner } from "typeorm";

export class StoreComplianceAppleBlocksReports1789412036228 implements MigrationInterface {
    name = 'StoreComplianceAppleBlocksReports1789412036228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_blocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blocker_profile_id" uuid NOT NULL, "blocked_profile_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_blocks_blocker_blocked" UNIQUE ("blocker_profile_id", "blocked_profile_id"), CONSTRAINT "CHK_user_blocks_not_self" CHECK ("blocker_profile_id" <> "blocked_profile_id"), CONSTRAINT "PK_0bae5f5cab7574a84889462187c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_user_blocks_blocker_profile_id" ON "user_blocks" ("blocker_profile_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_blocks_blocked_profile_id" ON "user_blocks" ("blocked_profile_id") `);
        await queryRunner.query(`ALTER TABLE "user_auth_providers" ADD "refresh_token_encrypted" text`);
        await queryRunner.query(`ALTER TABLE "user_auth_providers" ADD "oauth_client_id" character varying`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "target_chat_message_id" uuid`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "target_assistant_conversation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "target_assistant_message_id" character varying`);
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
        await queryRunner.query(`ALTER TYPE "public"."report_categories_target_type_enum" RENAME TO "report_categories_target_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."report_categories_target_type_enum" AS ENUM('profile', 'dealership', 'vehicle', 'chat_message', 'assistant_message')`);
        await queryRunner.query(`ALTER TABLE "report_categories" ALTER COLUMN "target_type" TYPE "public"."report_categories_target_type_enum" USING "target_type"::"text"::"public"."report_categories_target_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."report_categories_target_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."reports_target_type_enum" RENAME TO "reports_target_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."reports_target_type_enum" AS ENUM('profile', 'dealership', 'vehicle', 'chat_message', 'assistant_message')`);
        await queryRunner.query(`ALTER TABLE "reports" ALTER COLUMN "target_type" TYPE "public"."reports_target_type_enum" USING "target_type"::"text"::"public"."reports_target_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reports_target_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "notification_channels" SET DEFAULT '["email","in_app"]'`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "CHK_reports_target_fks" CHECK ((
    "target_type" = 'profile'
    AND "target_profile_id" IS NOT NULL
    AND "target_dealership_id" IS NULL
    AND "target_vehicle_id" IS NULL
    AND "target_chat_message_id" IS NULL
    AND "target_assistant_conversation_id" IS NULL
    AND "target_assistant_message_id" IS NULL
  )
  OR (
    "target_type" = 'dealership'
    AND "target_dealership_id" IS NOT NULL
    AND "target_profile_id" IS NULL
    AND "target_vehicle_id" IS NULL
    AND "target_chat_message_id" IS NULL
    AND "target_assistant_conversation_id" IS NULL
    AND "target_assistant_message_id" IS NULL
  )
  OR (
    "target_type" = 'vehicle'
    AND "target_vehicle_id" IS NOT NULL
    AND "target_profile_id" IS NULL
    AND "target_dealership_id" IS NULL
    AND "target_chat_message_id" IS NULL
    AND "target_assistant_conversation_id" IS NULL
    AND "target_assistant_message_id" IS NULL
  )
  OR (
    "target_type" = 'chat_message'
    AND "target_chat_message_id" IS NOT NULL
    AND "target_profile_id" IS NULL
    AND "target_dealership_id" IS NULL
    AND "target_vehicle_id" IS NULL
    AND "target_assistant_conversation_id" IS NULL
    AND "target_assistant_message_id" IS NULL
  )
  OR (
    "target_type" = 'assistant_message'
    AND "target_assistant_conversation_id" IS NOT NULL
    AND "target_assistant_message_id" IS NOT NULL
    AND "target_profile_id" IS NULL
    AND "target_dealership_id" IS NULL
    AND "target_vehicle_id" IS NULL
    AND "target_chat_message_id" IS NULL
  ))`);
        await queryRunner.query(`ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_d68a998da9473c6a46058bd1af6" FOREIGN KEY ("blocker_profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_9261d9f17a3bb8d13814941f107" FOREIGN KEY ("blocked_profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_e579ac3f3f3d61e69a54727dcdc" FOREIGN KEY ("target_chat_message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_3bcde3ed507eae5b53d57eae811" FOREIGN KEY ("target_assistant_conversation_id") REFERENCES "assistant_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_3bcde3ed507eae5b53d57eae811"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_e579ac3f3f3d61e69a54727dcdc"`);
        await queryRunner.query(`ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_9261d9f17a3bb8d13814941f107"`);
        await queryRunner.query(`ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_d68a998da9473c6a46058bd1af6"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "CHK_reports_target_fks"`);
        await queryRunner.query(`ALTER TABLE "alerts" ALTER COLUMN "notification_channels" SET DEFAULT '["email", "in_app"]'`);
        await queryRunner.query(`CREATE TYPE "public"."reports_target_type_enum_old" AS ENUM('dealership', 'profile', 'vehicle')`);
        await queryRunner.query(`ALTER TABLE "reports" ALTER COLUMN "target_type" TYPE "public"."reports_target_type_enum_old" USING "target_type"::"text"::"public"."reports_target_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."reports_target_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."reports_target_type_enum_old" RENAME TO "reports_target_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."report_categories_target_type_enum_old" AS ENUM('dealership', 'profile', 'vehicle')`);
        await queryRunner.query(`ALTER TABLE "report_categories" ALTER COLUMN "target_type" TYPE "public"."report_categories_target_type_enum_old" USING "target_type"::"text"::"public"."report_categories_target_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."report_categories_target_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."report_categories_target_type_enum_old" RENAME TO "report_categories_target_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."profile_type_enum_old" AS ENUM('particular', 'professional')`);
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
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "target_assistant_message_id"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "target_assistant_conversation_id"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "target_chat_message_id"`);
        await queryRunner.query(`ALTER TABLE "user_auth_providers" DROP COLUMN "oauth_client_id"`);
        await queryRunner.query(`ALTER TABLE "user_auth_providers" DROP COLUMN "refresh_token_encrypted"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_blocks_blocked_profile_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_blocks_blocker_profile_id"`);
        await queryRunner.query(`DROP TABLE "user_blocks"`);
    }

}
