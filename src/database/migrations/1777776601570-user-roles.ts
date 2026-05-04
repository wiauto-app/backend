import { MigrationInterface, QueryRunner } from "typeorm";

export class UserRoles1777776601570 implements MigrationInterface {
    name = 'UserRoles1777776601570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "profile" ADD "role_id" uuid`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_414e6b50d51f911cba91fb76eba" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_414e6b50d51f911cba91fb76eba"`);
        await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "role_id"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
