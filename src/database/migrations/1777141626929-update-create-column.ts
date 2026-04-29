import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCreateColumn1777141626929 implements MigrationInterface {
    name = 'UpdateCreateColumn1777141626929'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_3f9508ea379ef90caec5d159382"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_676ea8d79fa1a0828422202c242"`);
        await queryRunner.query(`ALTER TABLE "vehicle_videos" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "vehicle_videos" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "features" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "features" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_676ea8d79fa1a0828422202c242" FOREIGN KEY ("featuresId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_3f9508ea379ef90caec5d159382" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_3f9508ea379ef90caec5d159382"`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" DROP CONSTRAINT "FK_676ea8d79fa1a0828422202c242"`);
        await queryRunner.query(`ALTER TABLE "features" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "features" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicle_videos" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicle_videos" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_676ea8d79fa1a0828422202c242" FOREIGN KEY ("featuresId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "vehicle_features" ADD CONSTRAINT "FK_3f9508ea379ef90caec5d159382" FOREIGN KEY ("vehiclesId") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
