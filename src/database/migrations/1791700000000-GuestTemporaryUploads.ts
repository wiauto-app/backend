import { MigrationInterface, QueryRunner } from "typeorm";

export class GuestTemporaryUploads1791700000000 implements MigrationInterface {
  name = "GuestTemporaryUploads1791700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Permitir subidas temporales de usuarios anónimos (identificados por cookie guest_id)
    await queryRunner.query(
      `ALTER TABLE "temporary_uploads" ALTER COLUMN "profile_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "temporary_uploads" ADD "guest_id" UUID NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_temporary_uploads_guest_id" ON "temporary_uploads" ("guest_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "temporary_uploads"
      ADD CONSTRAINT "CHK_temporary_uploads_owner"
      CHECK ("profile_id" IS NOT NULL OR "guest_id" IS NOT NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "temporary_uploads" DROP CONSTRAINT "CHK_temporary_uploads_owner"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_temporary_uploads_guest_id"`,
    );
    // Las subidas de invitados no reclamadas no tienen dueño en el esquema anterior
    await queryRunner.query(
      `DELETE FROM "temporary_uploads" WHERE "profile_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "temporary_uploads" DROP COLUMN "guest_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "temporary_uploads" ALTER COLUMN "profile_id" SET NOT NULL`,
    );
  }
}
