import { MigrationInterface, QueryRunner } from "typeorm";

export class ShowCollabReview1787863071404 implements MigrationInterface {
    name = 'ShowCollabReview1787863071404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_temporary_uploads_profile_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_temporary_uploads_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_temporary_uploads_expires_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_vehicle_images_status"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "show_review_collab" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."vehicles_condition_enum" RENAME TO "vehicles_condition_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_condition_enum" AS ENUM('new', 'used', '0KM')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "condition" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "condition" TYPE "public"."vehicles_condition_enum" USING "condition"::"text"::"public"."vehicles_condition_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "condition" SET DEFAULT 'new'`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_condition_enum_old"`);
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
        await queryRunner.query(`ALTER TYPE "public"."temporary_upload_status_enum" RENAME TO "temporary_upload_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."temporary_uploads_status_enum" AS ENUM('pending_upload', 'uploaded', 'consumed', 'expired')`);
        await queryRunner.query(`ALTER TABLE "temporary_uploads" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "temporary_uploads" ALTER COLUMN "status" TYPE "public"."temporary_uploads_status_enum" USING "status"::"text"::"public"."temporary_uploads_status_enum"`);
        await queryRunner.query(`ALTER TABLE "temporary_uploads" ALTER COLUMN "status" SET DEFAULT 'pending_upload'`);
        await queryRunner.query(`DROP TYPE "public"."temporary_upload_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."vehicle_image_status_enum" RENAME TO "vehicle_image_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicle_images_status_enum" AS ENUM('uploaded', 'processing', 'ready', 'failed')`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ALTER COLUMN "status" TYPE "public"."vehicle_images_status_enum" USING "status"::"text"::"public"."vehicle_images_status_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ALTER COLUMN "status" SET DEFAULT 'uploaded'`);
        await queryRunner.query(`DROP TYPE "public"."vehicle_image_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."vehicle_image_status_enum_old" AS ENUM('uploaded', 'processing', 'ready', 'failed')`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ALTER COLUMN "status" TYPE "public"."vehicle_image_status_enum_old" USING "status"::"text"::"public"."vehicle_image_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ALTER COLUMN "status" SET DEFAULT 'uploaded'`);
        await queryRunner.query(`DROP TYPE "public"."vehicle_images_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."vehicle_image_status_enum_old" RENAME TO "vehicle_image_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."temporary_upload_status_enum_old" AS ENUM('pending_upload', 'uploaded', 'consumed', 'expired')`);
        await queryRunner.query(`ALTER TABLE "temporary_uploads" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "temporary_uploads" ALTER COLUMN "status" TYPE "public"."temporary_upload_status_enum_old" USING "status"::"text"::"public"."temporary_upload_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "temporary_uploads" ALTER COLUMN "status" SET DEFAULT 'pending_upload'`);
        await queryRunner.query(`DROP TYPE "public"."temporary_uploads_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."temporary_upload_status_enum_old" RENAME TO "temporary_upload_status_enum"`);
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
        await queryRunner.query(`CREATE TYPE "public"."vehicles_condition_enum_old" AS ENUM('new', 'used')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "condition" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "condition" TYPE "public"."vehicles_condition_enum_old" USING "condition"::"text"::"public"."vehicles_condition_enum_old"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "condition" SET DEFAULT 'new'`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_condition_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."vehicles_condition_enum_old" RENAME TO "vehicles_condition_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "show_review_collab"`);
        await queryRunner.query(`CREATE INDEX "idx_vehicle_images_status" ON "vehicle_images" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_temporary_uploads_expires_at" ON "temporary_uploads" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "idx_temporary_uploads_status" ON "temporary_uploads" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_temporary_uploads_profile_id" ON "temporary_uploads" ("profile_id") `);
    }

}
