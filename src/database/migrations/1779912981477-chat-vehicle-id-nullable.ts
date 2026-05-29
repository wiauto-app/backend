import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatVehicleIdNullable1779912981477 implements MigrationInterface {
    name = 'ChatVehicleIdNullable1779912981477'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_chat_id"`);
        await queryRunner.query(`ALTER TABLE "chats" DROP CONSTRAINT "FK_chats_vehicle_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_chat_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chat_messages_sender_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_chats_participants"`);
        await queryRunner.query(`ALTER TABLE "chats" ALTER COLUMN "vehicle_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_9f5c0b96255734666b7b4bc98c3" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_9f5c0b96255734666b7b4bc98c3"`);
        await queryRunner.query(`ALTER TABLE "chats" ALTER COLUMN "vehicle_id" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_chats_participants" ON "chats" ("participants") `);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_sender_id" ON "chat_messages" ("sender_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_chat_messages_chat_id" ON "chat_messages" ("chat_id") `);
        await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_chat_id" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
