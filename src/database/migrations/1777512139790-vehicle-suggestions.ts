import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleSuggestions1777512139790 implements MigrationInterface {
    name = 'VehicleSuggestions1777512139790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_1fc11da3472768e1bae4ab53c0e"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_7db01f71d52bcd8b1da81665b2f"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_97fcbf2eb463f0c57dd7ef4c9cd"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_b2648854ed86bd3c4bee54c35bd"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_ea89bd79b001732db2c5111c068"`);
        await queryRunner.query(`ALTER TABLE "model" DROP CONSTRAINT "FK_4912a41adf7e3392e4932f7c90d"`);
        await queryRunner.query(`ALTER TABLE "make" DROP COLUMN "section_1_id"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "suggestions" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_a68eca87181ccede03291b39aab"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "condition"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_condition_enum" AS ENUM('new', 'used')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "condition" "public"."vehicles_condition_enum" NOT NULL DEFAULT 'new'`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "traction_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_a68eca87181ccede03291b39aab" FOREIGN KEY ("traction_id") REFERENCES "tractions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_a68eca87181ccede03291b39aab"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "traction_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "condition"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_condition_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "condition" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_a68eca87181ccede03291b39aab" FOREIGN KEY ("traction_id") REFERENCES "tractions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "suggestions"`);
        await queryRunner.query(`ALTER TABLE "make" ADD "section_1_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "model" ADD CONSTRAINT "FK_4912a41adf7e3392e4932f7c90d" FOREIGN KEY ("make_id") REFERENCES "make"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_ea89bd79b001732db2c5111c068" FOREIGN KEY ("year_id") REFERENCES "year"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_b2648854ed86bd3c4bee54c35bd" FOREIGN KEY ("make_id") REFERENCES "make"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_97fcbf2eb463f0c57dd7ef4c9cd" FOREIGN KEY ("body_type_id") REFERENCES "body_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_7db01f71d52bcd8b1da81665b2f" FOREIGN KEY ("model_id") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_1fc11da3472768e1bae4ab53c0e" FOREIGN KEY ("fuel_type_id") REFERENCES "fuel_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
