import { MigrationInterface, QueryRunner } from "typeorm";

export class ImagesVehiclesRelation1776925109682 implements MigrationInterface {
    name = 'ImagesVehiclesRelation1776925109682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" DROP CONSTRAINT "FK_a858372b2d55cbd590dff5cd9cf"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" ADD "vehicleId" uuid`);
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" ADD CONSTRAINT "FK_95576b96b56fecd621c1b55d7f6" FOREIGN KEY ("vehicleId") REFERENCES "vehicle_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" DROP CONSTRAINT "FK_95576b96b56fecd621c1b55d7f6"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" DROP COLUMN "vehicleId"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" ADD CONSTRAINT "FK_a858372b2d55cbd590dff5cd9cf" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
