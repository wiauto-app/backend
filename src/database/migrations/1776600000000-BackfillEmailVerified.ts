import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Usuarios anteriores a la verificación por correo quedan marcados como verificados;
 * los altas nuevas siguen con is_email_verified = false por defecto en la entidad.
 */
export class BackfillEmailVerified1776600000000 implements MigrationInterface {
  name = "BackfillEmailVerified1776600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "users" SET "is_email_verified" = true`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    /* Sin snapshot por fila; no revertir en masa */
  }
}
