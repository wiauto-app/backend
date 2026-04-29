import { MigrationInterface, QueryRunner } from "typeorm";

export class FeatureUnique1777141983957 implements MigrationInterface {
    name = 'FeatureUnique1777141983957'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_3f9508ea379ef90caec5d159382"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_676ea8d79fa1a0828422202c242"`);
        await queryRunner.query(`ALTER TABLE "features" ADD CONSTRAINT "UQ_bcc3a344ae156a9fba128e1cb4d" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_676ea8d79fa1a0828422202c242" FOREIGN KEY ("featuresId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_3f9508ea379ef90caec5d159382" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_3f9508ea379ef90caec5d159382"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_676ea8d79fa1a0828422202c242"`);
        await queryRunner.query(`ALTER TABLE "features" DROP CONSTRAINT "UQ_bcc3a344ae156a9fba128e1cb4d"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_676ea8d79fa1a0828422202c242" FOREIGN KEY ("featuresId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_3f9508ea379ef90caec5d159382" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
