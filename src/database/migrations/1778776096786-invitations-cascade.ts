import { MigrationInterface, QueryRunner } from "typeorm";

export class InvitationsCascade1778776096786 implements MigrationInterface {
    name = 'InvitationsCascade1778776096786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dealership_invitations" DROP CONSTRAINT "FK_69c2aa027558e6540d4e136a751"`);
        await queryRunner.query(`ALTER TABLE "dealership_invitations" DROP CONSTRAINT "FK_f3a81a4a5f3b58705734b5ebea2"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dealership_invitations" ADD CONSTRAINT "FK_69c2aa027558e6540d4e136a751" FOREIGN KEY ("invited_by_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dealership_invitations" ADD CONSTRAINT "FK_f3a81a4a5f3b58705734b5ebea2" FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dealership_invitations" DROP CONSTRAINT "FK_f3a81a4a5f3b58705734b5ebea2"`);
        await queryRunner.query(`ALTER TABLE "dealership_invitations" DROP CONSTRAINT "FK_69c2aa027558e6540d4e136a751"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dealership_invitations" ADD CONSTRAINT "FK_f3a81a4a5f3b58705734b5ebea2" FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dealership_invitations" ADD CONSTRAINT "FK_69c2aa027558e6540d4e136a751" FOREIGN KEY ("invited_by_id") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
