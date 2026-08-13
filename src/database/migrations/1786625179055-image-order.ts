import { MigrationInterface, QueryRunner } from "typeorm";

export class ImageOrder1786625179055 implements MigrationInterface {
    name = "ImageOrder1786625179055";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear la columna inicialmente permitiendo NULL
        await queryRunner.query(`
            ALTER TABLE "vehicle_images"
            ADD "order" integer
        `);

        // 2. Asignar el orden de las imágenes dentro de cada vehículo
        //    según created_at ASC
        await queryRunner.query(`
            WITH ordered_images AS (
                SELECT
                    "id",
                    ROW_NUMBER() OVER (
                        PARTITION BY "vehicle_id"
                        ORDER BY "created_at" ASC, "id" ASC
                    ) AS "image_order"
                FROM "vehicle_images"
            )
            UPDATE "vehicle_images" vi
            SET "order" = oi."image_order"
            FROM ordered_images oi
            WHERE vi."id" = oi."id"
        `);

        // 3. Una vez rellenados todos los registros,
        //    hacemos la columna obligatoria
        await queryRunner.query(`
            ALTER TABLE "vehicle_images"
            ALTER COLUMN "order" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TYPE "public"."vehicles_publisher_type_enum"
            RENAME TO "vehicles_publisher_type_enum_old"
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."vehicles_publisher_type_enum"
            AS ENUM('dealership', 'particular')
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicles"
            ALTER COLUMN "publisher_type" DROP DEFAULT
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicles"
            ALTER COLUMN "publisher_type"
            TYPE "public"."vehicles_publisher_type_enum"
            USING "publisher_type"::"text"::"public"."vehicles_publisher_type_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicles"
            ALTER COLUMN "publisher_type"
            SET DEFAULT 'particular'
        `);

        await queryRunner.query(`
            DROP TYPE "public"."vehicles_publisher_type_enum_old"
        `);

        await queryRunner.query(`
            ALTER TYPE "public"."profile_type_enum"
            RENAME TO "profile_type_enum_old"
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."profile_type_enum"
            AS ENUM('professional', 'particular')
        `);

        await queryRunner.query(`
            ALTER TABLE "profile"
            ALTER COLUMN "type" DROP DEFAULT
        `);

        await queryRunner.query(`
            ALTER TABLE "profile"
            ALTER COLUMN "type"
            TYPE "public"."profile_type_enum"
            USING "type"::"text"::"public"."profile_type_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "profile"
            ALTER COLUMN "type"
            SET DEFAULT 'particular'
        `);

        await queryRunner.query(`
            DROP TYPE "public"."profile_type_enum_old"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."profile_type_enum_old"
            AS ENUM('professional', 'particular')
        `);

        await queryRunner.query(`
            ALTER TABLE "profile"
            ALTER COLUMN "type" DROP DEFAULT
        `);

        await queryRunner.query(`
            ALTER TABLE "profile"
            ALTER COLUMN "type"
            TYPE "public"."profile_type_enum_old"
            USING "type"::"text"::"public"."profile_type_enum_old"
        `);

        await queryRunner.query(`
            ALTER TABLE "profile"
            ALTER COLUMN "type"
            SET DEFAULT 'particular'
        `);

        await queryRunner.query(`
            DROP TYPE "public"."profile_type_enum"
        `);

        await queryRunner.query(`
            ALTER TYPE "public"."profile_type_enum_old"
            RENAME TO "profile_type_enum"
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."vehicles_publisher_type_enum_old"
            AS ENUM('dealership', 'particular')
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicles"
            ALTER COLUMN "publisher_type" DROP DEFAULT
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicles"
            ALTER COLUMN "publisher_type"
            TYPE "public"."vehicles_publisher_type_enum_old"
            USING "publisher_type"::"text"::"public"."vehicles_publisher_type_enum_old"
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicles"
            ALTER COLUMN "publisher_type"
            SET DEFAULT 'particular'
        `);

        await queryRunner.query(`
            DROP TYPE "public"."vehicles_publisher_type_enum"
        `);

        await queryRunner.query(`
            ALTER TYPE "public"."vehicles_publisher_type_enum_old"
            RENAME TO "vehicles_publisher_type_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "vehicle_images"
            DROP COLUMN "order"
        `);
    }
}