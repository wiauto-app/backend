import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleIdRemove1777141674593 implements MigrationInterface {
    name = 'VehicleIdRemove1777141674593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_3f9508ea379ef90caec5d159382"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_676ea8d79fa1a0828422202c242"`);
        await queryRunner.query(`ALTER TABLE "features" DROP COLUMN "vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_676ea8d79fa1a0828422202c242" FOREIGN KEY ("featuresId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_3f9508ea379ef90caec5d159382" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_3f9508ea379ef90caec5d159382"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_676ea8d79fa1a0828422202c242"`);
        await queryRunner.query(`ALTER TABLE "features" ADD "vehicle_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_676ea8d79fa1a0828422202c242" FOREIGN KEY ("featuresId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_3f9508ea379ef90caec5d159382" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
