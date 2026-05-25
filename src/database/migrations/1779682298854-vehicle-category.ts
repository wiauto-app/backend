import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleCategory1779682298854 implements MigrationInterface {
    name = 'VehicleCategory1779682298854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "category_id" uuid`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_7c9c01029cf86e5b8fd281983fa" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_7c9c01029cf86e5b8fd281983fa"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "category_id"`);
    }

}
