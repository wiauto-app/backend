import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleTypes1777345215512 implements MigrationInterface {
    name = 'VehicleTypes1777345215512'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_3f9508ea379ef90caec5d159382"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_676ea8d79fa1a0828422202c242"`);
        await queryRunner.query(`CREATE TABLE "vehicle_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_73d1e40f4add7f4f6947acad3a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_3f9508ea379ef90caec5d159382" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_676ea8d79fa1a0828422202c242" FOREIGN KEY ("featuresId") REFERENCES "features"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_676ea8d79fa1a0828422202c242"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_3f9508ea379ef90caec5d159382"`);
        await queryRunner.query(`DROP TABLE "vehicle_types"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_676ea8d79fa1a0828422202c242" FOREIGN KEY ("featuresId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_3f9508ea379ef90caec5d159382" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
