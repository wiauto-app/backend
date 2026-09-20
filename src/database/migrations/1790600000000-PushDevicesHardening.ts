import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Endurece `notification_devices` para push:
 * - `tokenType` distingue tokens FCM (Android) de Expo Push Tokens (iOS).
 * - `appVersion` ya viajaba en el DTO pero no se persistía.
 * - Índice por `deviceId` para desactivar filas de otros usuarios en el mismo teléfono.
 * - Limpia tokens APNs crudos (hex) de iOS: `firebase-admin` no puede enviarles.
 */
export class PushDevicesHardening1790600000000 implements MigrationInterface {
  name = "PushDevicesHardening1790600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notification_devices_token_type_enum" AS ENUM('fcm', 'expo')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_devices" ADD "tokenType" "public"."notification_devices_token_type_enum" NOT NULL DEFAULT 'fcm'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_devices" ADD "appVersion" character varying(50)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_devices_deviceId" ON "notification_devices" ("deviceId")`,
    );
    await queryRunner.query(
      `DELETE FROM "notification_devices" WHERE "platform" = 'ios' AND "token" ~ '^[0-9a-fA-F]{64,}$'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notification_devices_deviceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_devices" DROP COLUMN "appVersion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_devices" DROP COLUMN "tokenType"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."notification_devices_token_type_enum"`,
    );
  }
}
