import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleIdImages1777513680816 implements MigrationInterface {
    name = 'VehicleIdImages1777513680816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_images" DROP CONSTRAINT "FK_0fcb9e0a442f0789daf320ccc1f"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ALTER COLUMN "vehicle_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ADD CONSTRAINT "FK_0fcb9e0a442f0789daf320ccc1f" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_images" DROP CONSTRAINT "FK_0fcb9e0a442f0789daf320ccc1f"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ALTER COLUMN "vehicle_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ADD CONSTRAINT "FK_0fcb9e0a442f0789daf320ccc1f" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
