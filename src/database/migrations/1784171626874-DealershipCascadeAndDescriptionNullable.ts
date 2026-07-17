import { MigrationInterface, QueryRunner } from "typeorm";

export class DealershipCascadeAndDescriptionNullable1784171626874 implements MigrationInterface {
    name = 'DealershipCascadeAndDescriptionNullable1784171626874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dealership_members" DROP CONSTRAINT "FK_5f1f981601c71a3d7d6c3dc831a"`);
        await queryRunner.query(`ALTER TABLE "dealership_members" DROP CONSTRAINT "FK_86407af303b599a664627d41425"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "description" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dealership_members" ADD CONSTRAINT "FK_86407af303b599a664627d41425" FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dealership_members" ADD CONSTRAINT "FK_5f1f981601c71a3d7d6c3dc831a" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dealership_members" DROP CONSTRAINT "FK_5f1f981601c71a3d7d6c3dc831a"`);
        await queryRunner.query(`ALTER TABLE "dealership_members" DROP CONSTRAINT "FK_86407af303b599a664627d41425"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "description" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dealership_members" ADD CONSTRAINT "FK_86407af303b599a664627d41425" FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dealership_members" ADD CONSTRAINT "FK_5f1f981601c71a3d7d6c3dc831a" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
