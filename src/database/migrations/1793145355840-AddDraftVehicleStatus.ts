import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDraftVehicleStatus1793145355840 implements MigrationInterface {
  name = "AddDraftVehicleStatus1793145355840";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."vehicles_status_enum" ADD VALUE IF NOT EXISTS 'draft'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL no permite eliminar valores de un enum de forma segura sin recrear el tipo.
  }
}
