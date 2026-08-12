import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfileDevices1786569475850 implements MigrationInterface {
    name = 'ProfileDevices1786569475850'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_devices_platform_enum" AS ENUM('ios', 'android')`);
        await queryRunner.query(`CREATE TABLE "notification_devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "token" text NOT NULL, "platform" "public"."notification_devices_platform_enum" NOT NULL, "deviceId" character varying(255), "deviceName" character varying(255), "osVersion" character varying(100), "isActive" boolean NOT NULL DEFAULT true, "lastSeenAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e10c4c1abd87d91ceddbb60a2ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4759b5047ddef21edacf91ce74" ON "notification_devices" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a16eae8ba29a8d22d0a910d14" ON "notification_devices" ("userId") `);
        await queryRunner.query(`ALTER TYPE "public"."vehicles_publisher_type_enum" RENAME TO "vehicles_publisher_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_publisher_type_enum" AS ENUM('dealership', 'particular')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" TYPE "public"."vehicles_publisher_type_enum" USING "publisher_type"::"text"::"public"."vehicles_publisher_type_enum"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_publisher_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."profile_type_enum" RENAME TO "profile_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."profile_type_enum" AS ENUM('professional', 'particular')`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" TYPE "public"."profile_type_enum" USING "type"::"text"::"public"."profile_type_enum"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."profile_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "notification_devices" ADD CONSTRAINT "FK_3a16eae8ba29a8d22d0a910d148" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_devices" DROP CONSTRAINT "FK_3a16eae8ba29a8d22d0a910d148"`);
        await queryRunner.query(`CREATE TYPE "public"."profile_type_enum_old" AS ENUM('particular', 'professional')`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" TYPE "public"."profile_type_enum_old" USING "type"::"text"::"public"."profile_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "profile" ALTER COLUMN "type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."profile_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."profile_type_enum_old" RENAME TO "profile_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_publisher_type_enum_old" AS ENUM('dealership', 'particular')`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" TYPE "public"."vehicles_publisher_type_enum_old" USING "publisher_type"::"text"::"public"."vehicles_publisher_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "publisher_type" SET DEFAULT 'particular'`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_publisher_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."vehicles_publisher_type_enum_old" RENAME TO "vehicles_publisher_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a16eae8ba29a8d22d0a910d14"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4759b5047ddef21edacf91ce74"`);
        await queryRunner.query(`DROP TABLE "notification_devices"`);
        await queryRunner.query(`DROP TYPE "public"."notification_devices_platform_enum"`);
    }

}
