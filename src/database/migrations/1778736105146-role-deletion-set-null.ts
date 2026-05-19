import { MigrationInterface, QueryRunner } from "typeorm";

export class RoleDeletionSetNull1778736105146 implements MigrationInterface {
    name = 'RoleDeletionSetNull1778736105146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_414e6b50d51f911cba91fb76eba"`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_414e6b50d51f911cba91fb76eba" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_414e6b50d51f911cba91fb76eba"`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_414e6b50d51f911cba91fb76eba" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
