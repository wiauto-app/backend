import { MigrationInterface, QueryRunner } from "typeorm";

export class ImagesVehiclesRelation1776924292699 implements MigrationInterface {
    name = 'ImagesVehiclesRelation1776924292699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" DROP COLUMN "vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" ADD "vehicle_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" ADD CONSTRAINT "FK_a858372b2d55cbd590dff5cd9cf" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" DROP CONSTRAINT "FK_a858372b2d55cbd590dff5cd9cf"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" DROP COLUMN "vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images_entity" ADD "vehicle_id" character varying NOT NULL`);
    }

}
