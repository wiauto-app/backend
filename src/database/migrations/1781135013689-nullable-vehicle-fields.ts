import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableVehicleFields1781135013689 implements MigrationInterface {
    name = 'NullableVehicleFields1781135013689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_091936a2c2f5cedc441bdbb616d"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_266824f2c93bbbdb7de7edeae32"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_7c9c01029cf86e5b8fd281983fa"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_8c6922f37d6f8a496a4cabfe080"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_a68eca87181ccede03291b39aab"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_b78dc0cd6578bd8340b7adb2b05"`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_ea89bd79b001732db2c5111c068" FOREIGN KEY ("year_id") REFERENCES "year"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_7c9c01029cf86e5b8fd281983fa" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_a68eca87181ccede03291b39aab" FOREIGN KEY ("traction_id") REFERENCES "tractions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_8c6922f37d6f8a496a4cabfe080" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_b78dc0cd6578bd8340b7adb2b05" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_091936a2c2f5cedc441bdbb616d" FOREIGN KEY ("dgt_label_id") REFERENCES "dgt_labels"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_266824f2c93bbbdb7de7edeae32" FOREIGN KEY ("warranty_type_id") REFERENCES "warranty_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_266824f2c93bbbdb7de7edeae32"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_091936a2c2f5cedc441bdbb616d"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_b78dc0cd6578bd8340b7adb2b05"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_8c6922f37d6f8a496a4cabfe080"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_a68eca87181ccede03291b39aab"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_7c9c01029cf86e5b8fd281983fa"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_ea89bd79b001732db2c5111c068"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_b78dc0cd6578bd8340b7adb2b05" FOREIGN KEY ("color_id") REFERENCES "colors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_a68eca87181ccede03291b39aab" FOREIGN KEY ("traction_id") REFERENCES "tractions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_8c6922f37d6f8a496a4cabfe080" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_7c9c01029cf86e5b8fd281983fa" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_266824f2c93bbbdb7de7edeae32" FOREIGN KEY ("warranty_type_id") REFERENCES "warranty_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_091936a2c2f5cedc441bdbb616d" FOREIGN KEY ("dgt_label_id") REFERENCES "dgt_labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
