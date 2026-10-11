import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehicleSearchHistory1791600000000 implements MigrationInterface {
  name = "CreateVehicleSearchHistory1791600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehicle_search_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "query" jsonb NOT NULL,
        "query_hash" character varying(64) NOT NULL,
        "label" character varying(255) NOT NULL,
        "filters_count" integer NOT NULL,
        "results_count" integer,
        "search_count" integer NOT NULL DEFAULT 1,
        "last_searched_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_search_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vehicle_search_history_user_query_hash" UNIQUE ("user_id", "query_hash"),
        CONSTRAINT "FK_vehicle_search_history_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_search_history_user_last_searched"
        ON "vehicle_search_history" ("user_id", "last_searched_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_vehicle_search_history_user_last_searched"`,
    );
    await queryRunner.query(`DROP TABLE "vehicle_search_history"`);
  }
}
