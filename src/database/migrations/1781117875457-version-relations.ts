import { MigrationInterface, QueryRunner } from "typeorm";

export class VersionRelations1781117875457 implements MigrationInterface {
    name = 'VersionRelations1781117875457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "FK_alerts_profile_id"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_profile_id"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_b2648854ed86bd3c4bee54c35bd" FOREIGN KEY ("make_id") REFERENCES "make"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_7db01f71d52bcd8b1da81665b2f" FOREIGN KEY ("model_id") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_97fcbf2eb463f0c57dd7ef4c9cd" FOREIGN KEY ("body_type_id") REFERENCES "body_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "version" ADD CONSTRAINT "FK_1fc11da3472768e1bae4ab53c0e" FOREIGN KEY ("fuel_type_id") REFERENCES "fuel_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alerts" ADD CONSTRAINT "FK_f3147b52731056a05d753d79982" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_e4e6182b948811885ee2a90d589" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_36ef7d02a795eae29567f67de69" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_36ef7d02a795eae29567f67de69"`);
        await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_e4e6182b948811885ee2a90d589"`);
        await queryRunner.query(`ALTER TABLE "alerts" DROP CONSTRAINT "FK_f3147b52731056a05d753d79982"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_1fc11da3472768e1bae4ab53c0e"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_97fcbf2eb463f0c57dd7ef4c9cd"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_7db01f71d52bcd8b1da81665b2f"`);
        await queryRunner.query(`ALTER TABLE "version" DROP CONSTRAINT "FK_b2648854ed86bd3c4bee54c35bd"`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leads" ADD CONSTRAINT "FK_leads_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alerts" ADD CONSTRAINT "FK_alerts_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
