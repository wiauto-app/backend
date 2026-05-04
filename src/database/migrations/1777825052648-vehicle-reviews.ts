import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleReviews1777825052648 implements MigrationInterface {
    name = 'VehicleReviews1777825052648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_suspension_duration_type"`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" integer NOT NULL, "comment" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "profile_id" uuid NOT NULL, "vehicle_id" uuid NOT NULL, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f5059bb18fe5f999f66a76adc6" ON "suspension_duration_types" ("key") `);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_fe61806a8ae342e628aaa93ac47" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_d2d7bf64c4e8f73674a86466c48" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_8461c44164827f56ea03ead2b3c" FOREIGN KEY ("suspension_duration_type_id") REFERENCES "suspension_duration_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_8461c44164827f56ea03ead2b3c"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_d2d7bf64c4e8f73674a86466c48"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_fe61806a8ae342e628aaa93ac47"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5059bb18fe5f999f66a76adc6"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_suspension_duration_type" FOREIGN KEY ("suspension_duration_type_id") REFERENCES "suspension_duration_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
