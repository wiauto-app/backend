import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfessionalAccountContact1788464669334
  implements MigrationInterface
{
  name = "AddProfessionalAccountContact1788464669334";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "professional_accounts" ADD "email" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_accounts" ADD "phone_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_accounts" ADD "phone" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "professional_accounts" DROP COLUMN "phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_accounts" DROP COLUMN "phone_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_accounts" DROP COLUMN "email"`,
    );
  }
}
