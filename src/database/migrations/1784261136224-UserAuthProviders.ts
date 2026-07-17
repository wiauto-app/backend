import { MigrationInterface, QueryRunner } from "typeorm";

export class UserAuthProviders1784261136224 implements MigrationInterface {
    name = 'UserAuthProviders1784261136224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_auth_providers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" character varying NOT NULL, "provider_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e3b60f30b8112ac5bb474a2fe4b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_auth_providers" ADD CONSTRAINT "FK_f1b986eb2b94d3c3beaf580c092" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d2cd620862a631c16006c9eaac" ON "user_auth_providers" ("user_id", "provider") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5238694289bea978152906199f" ON "user_auth_providers" ("provider", "provider_id") `);

        await queryRunner.query(`
            INSERT INTO "user_auth_providers" ("id", "user_id", "provider", "provider_id", "created_at")
            SELECT uuid_generate_v4(), "id", "provider", "provider_id", NOW()
            FROM "users"
            WHERE "provider" IN ('google', 'apple')
              AND "provider_id" IS NOT NULL
        `);

        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "provider_id" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "provider" character varying NOT NULL DEFAULT 'local'`);

        await queryRunner.query(`
            UPDATE "users" AS u
            SET
                "provider" = ap."provider",
                "provider_id" = ap."provider_id"
            FROM (
                SELECT DISTINCT ON ("user_id")
                    "user_id",
                    "provider",
                    "provider_id"
                FROM "user_auth_providers"
                ORDER BY "user_id", "created_at" ASC
            ) AS ap
            WHERE ap."user_id" = u."id"
        `);

        await queryRunner.query(`ALTER TABLE "user_auth_providers" DROP CONSTRAINT "FK_f1b986eb2b94d3c3beaf580c092"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5238694289bea978152906199f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2cd620862a631c16006c9eaac"`);
        await queryRunner.query(`DROP TABLE "user_auth_providers"`);
    }

}
