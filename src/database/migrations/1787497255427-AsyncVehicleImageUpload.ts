import { MigrationInterface, QueryRunner } from "typeorm";

export class AsyncVehicleImageUpload1787497255427 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Crear enum para temporary_uploads.status
        await queryRunner.query(`
            CREATE TYPE temporary_upload_status_enum AS ENUM ('pending_upload', 'uploaded', 'consumed', 'expired');
        `);

        // Crear tabla temporary_uploads
        await queryRunner.query(`
            CREATE TABLE temporary_uploads (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                profile_id UUID NOT NULL,
                storage_path VARCHAR NOT NULL,
                mime_type VARCHAR NOT NULL,
                size_bytes INTEGER NOT NULL,
                status temporary_upload_status_enum NOT NULL DEFAULT 'pending_upload',
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        // Crear índices en temporary_uploads
        await queryRunner.query(`
            CREATE INDEX idx_temporary_uploads_profile_id ON temporary_uploads (profile_id);
        `);
        await queryRunner.query(`
            CREATE INDEX idx_temporary_uploads_status ON temporary_uploads (status);
        `);
        await queryRunner.query(`
            CREATE INDEX idx_temporary_uploads_expires_at ON temporary_uploads (expires_at);
        `);

        // Crear enum para vehicle_images.status
        await queryRunner.query(`
            CREATE TYPE vehicle_image_status_enum AS ENUM ('uploaded', 'processing', 'ready', 'failed');
        `);

        // Modificar vehicle_images: hacer url nullable
        await queryRunner.query(`
            ALTER TABLE vehicle_images 
            ALTER COLUMN url DROP NOT NULL;
        `);

        // Añadir nuevas columnas a vehicle_images
        await queryRunner.query(`
            ALTER TABLE vehicle_images 
            ADD COLUMN status vehicle_image_status_enum NOT NULL DEFAULT 'uploaded',
            ADD COLUMN source_path VARCHAR NULL,
            ADD COLUMN failure_reason TEXT NULL;
        `);

        // Actualizar imágenes existentes a estado 'ready' (ya están procesadas)
        await queryRunner.query(`
            UPDATE vehicle_images 
            SET status = 'ready' 
            WHERE url IS NOT NULL;
        `);

        // Crear índice en vehicle_images.status
        await queryRunner.query(`
            CREATE INDEX idx_vehicle_images_status ON vehicle_images (status);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir cambios en vehicle_images
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_vehicle_images_status;
        `);
        
        await queryRunner.query(`
            ALTER TABLE vehicle_images 
            DROP COLUMN failure_reason,
            DROP COLUMN source_path,
            DROP COLUMN status;
        `);

        await queryRunner.query(`
            ALTER TABLE vehicle_images 
            ALTER COLUMN url SET NOT NULL;
        `);

        await queryRunner.query(`
            DROP TYPE vehicle_image_status_enum;
        `);

        // Revertir temporary_uploads
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_temporary_uploads_expires_at;
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_temporary_uploads_status;
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_temporary_uploads_profile_id;
        `);
        
        await queryRunner.query(`
            DROP TABLE temporary_uploads;
        `);

        await queryRunner.query(`
            DROP TYPE temporary_upload_status_enum;
        `);
    }

}
