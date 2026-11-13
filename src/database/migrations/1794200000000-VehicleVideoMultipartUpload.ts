import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleVideoMultipartUpload1794200000000 implements MigrationInterface {
  name = "VehicleVideoMultipartUpload1794200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Sesiones de subida multipart directa a R2
    await queryRunner.query(`
      CREATE TYPE "video_upload_session_status_enum"
      AS ENUM ('initiated', 'uploaded', 'consumed', 'aborted', 'expired')
    `);
    await queryRunner.query(`
      CREATE TABLE "video_upload_sessions" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "profile_id" UUID NOT NULL,
        "storage_key" TEXT NOT NULL,
        "multipart_upload_id" TEXT NOT NULL,
        "mime_type" VARCHAR(100) NOT NULL,
        "original_filename" TEXT NULL,
        "size_bytes" BIGINT NOT NULL,
        "part_size" INTEGER NOT NULL,
        "part_count" INTEGER NOT NULL,
        "duration_s" REAL NULL,
        "width" INTEGER NULL,
        "height" INTEGER NULL,
        "status" "video_upload_session_status_enum" NOT NULL DEFAULT 'initiated',
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_video_upload_sessions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_video_upload_sessions_profile_id" ON "video_upload_sessions" ("profile_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_video_upload_sessions_status_expires" ON "video_upload_sessions" ("status", "expires_at")`,
    );

    // vehicle_videos: estado de procesamiento y metadatos
    await queryRunner.query(`
      CREATE TYPE "vehicle_video_status_enum"
      AS ENUM ('uploaded', 'processing', 'ready', 'failed')
    `);
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ALTER COLUMN "status" DROP DEFAULT`,
    );
    // Los vídeos legacy ('active') ya se sirven tal cual: pasan a 'ready'
    await queryRunner.query(`
      ALTER TABLE "vehicle_videos"
      ALTER COLUMN "status" TYPE "vehicle_video_status_enum"
      USING (CASE WHEN "status" = 'active' THEN 'ready' ELSE 'failed' END)::"vehicle_video_status_enum"
    `);
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ALTER COLUMN "status" SET DEFAULT 'uploaded'`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ALTER COLUMN "url" DROP NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "vehicle_videos"
        ADD "thumbnail_url" VARCHAR NULL,
        ADD "source_key" TEXT NULL,
        ADD "mime_type" VARCHAR(100) NULL,
        ADD "original_size" BIGINT NULL,
        ADD "duration_s" REAL NULL,
        ADD "width" INTEGER NULL,
        ADD "height" INTEGER NULL,
        ADD "failure_reason" TEXT NULL
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_vehicle_videos_status" ON "vehicle_videos" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vehicle_videos_status"`);
    // Los vídeos aún sin URL no existían en el esquema anterior
    await queryRunner.query(`DELETE FROM "vehicle_videos" WHERE "url" IS NULL`);
    await queryRunner.query(`
      ALTER TABLE "vehicle_videos"
        DROP COLUMN "thumbnail_url",
        DROP COLUMN "source_key",
        DROP COLUMN "mime_type",
        DROP COLUMN "original_size",
        DROP COLUMN "duration_s",
        DROP COLUMN "width",
        DROP COLUMN "height",
        DROP COLUMN "failure_reason"
    `);
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ALTER COLUMN "url" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`
      ALTER TABLE "vehicle_videos"
      ALTER COLUMN "status" TYPE VARCHAR
      USING (CASE WHEN "status" = 'ready' THEN 'active' ELSE "status"::text END)
    `);
    await queryRunner.query(
      `ALTER TABLE "vehicle_videos" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "vehicle_video_status_enum"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_video_upload_sessions_status_expires"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_video_upload_sessions_profile_id"`,
    );
    await queryRunner.query(`DROP TABLE "video_upload_sessions"`);
    await queryRunner.query(`DROP TYPE "video_upload_session_status_enum"`);
  }
}
