import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Schema `crawl`: staging propio del crawler coches.net (coches-net-crawl).
 * El crawler escribe aquí y luego hace merge transaccional hacia el catálogo
 * público (make, model, year, body_type, fuel_type, version).
 *
 * El rol `wiauto_crawler` y sus GRANTs NO se crean aquí (contienen secretos);
 * ver coches-net-crawl/README.md.
 */
export class CrawlSchema1794700000000 implements MigrationInterface {
  name = "CrawlSchema1794700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS crawl`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS crawl.makes (
        id SERIAL PRIMARY KEY,
        section_1_id INT NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS crawl.models (
        id SERIAL PRIMARY KEY,
        make_id INT NOT NULL REFERENCES crawl.makes(id) ON DELETE CASCADE,
        model_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (make_id, model_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS crawl.body_types (
        id SERIAL PRIMARY KEY,
        body_type_id INT NOT NULL,
        doors INT,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (body_type_id, doors)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS crawl.fuel_types (
        id SERIAL PRIMARY KEY,
        fuel_id INT NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS crawl.years (
        id SERIAL PRIMARY KEY,
        year INT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS crawl.versions (
        id SERIAL PRIMARY KEY,
        version_id INT NOT NULL UNIQUE,
        make_id INT NOT NULL REFERENCES crawl.makes(id) ON DELETE CASCADE,
        model_id INT NOT NULL REFERENCES crawl.models(id) ON DELETE CASCADE,
        body_type_id INT NOT NULL REFERENCES crawl.body_types(id) ON DELETE CASCADE,
        fuel_type_id INT NOT NULL REFERENCES crawl.fuel_types(id) ON DELETE CASCADE,
        year_id INT NOT NULL REFERENCES crawl.years(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        technical_url_path VARCHAR(512),
        specs_scraped_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Specs: no se mergean al catálogo, pero el crawler las usa (endpoint manual).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS crawl.version_specifications (
        id SERIAL PRIMARY KEY,
        version_id INT NOT NULL UNIQUE REFERENCES crawl.versions(version_id) ON DELETE CASCADE,
        acceleration NUMERIC(6, 2),
        consumption_average NUMERIC(6, 2),
        consumption_extra_urban NUMERIC(6, 2),
        consumption_urban NUMERIC(6, 2),
        cubic_capacity INT,
        cylinders VARCHAR(255),
        distribution VARCHAR(255),
        doors INT,
        emissions NUMERIC(10, 2),
        fuel_tank_capacity NUMERIC(8, 2),
        fuel_type VARCHAR(100),
        gear_box VARCHAR(100),
        height INT,
        length INT,
        width INT,
        weight INT,
        hp INT,
        hp_rpm INT,
        torque NUMERIC(10, 2),
        torque_rpm INT,
        seats INT,
        luggage_capacity INT,
        supply VARCHAR(255),
        traction VARCHAR(100),
        top_speed INT,
        year INT,
        price NUMERIC(12, 2),
        init_marketed_date TIMESTAMP,
        images JSONB,
        marketed_versions JSONB,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        crawl_id UUID
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS crawl.crawl_logs (
        id SERIAL PRIMARY KEY,
        crawl_id UUID NOT NULL,
        crawl_type VARCHAR(20) DEFAULT 'catalog',
        status VARCHAR(50),
        processed_count INT DEFAULT 0,
        total_count INT DEFAULT 0,
        error_count INT DEFAULT 0,
        message TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_crawl_models_make_id ON crawl.models(make_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_crawl_versions_make ON crawl.versions(make_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_crawl_versions_model ON crawl.versions(model_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_crawl_versions_body_type ON crawl.versions(body_type_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_crawl_versions_fuel_type ON crawl.versions(fuel_type_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_crawl_versions_year ON crawl.versions(year_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_crawl_logs_crawl_id ON crawl.crawl_logs(crawl_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_crawl_logs_type_id ON crawl.crawl_logs(crawl_type, id DESC)`);

    // Mismo slugify que scripts/migrations/import-crawl-catalog.sql, pero permanente
    // en el schema crawl para que el rol del crawler no necesite CREATE en public.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION crawl.catalog_slugify(input text)
      RETURNS text
      LANGUAGE sql
      IMMUTABLE
      AS $$
        SELECT trim(
          both '-' FROM regexp_replace(
            regexp_replace(
              lower(
                translate(
                  coalesce(nullif(trim(input), ''), 'n-a'),
                  'áàäâãåāăąéèëêēĕėęěíìïîĩīĭįıóòöôõōŏőúùüûũūŭůýÿñçÁÀÄÂÃÅĀĂĄÉÈËÊĒĔĖĘĚÍÌÏÎĨĪĬĮİÓÒÖÔÕŌŎŐÚÙÜÛŨŪŬŮÝŸÑÇ',
                  'aaaaaaaaaeeeeeeeeeeiiiiiiiiioooooooouuuuuuuuyyncAAAAAAAAAEEEEEEEEEEIIIIIIIIIOOOOOOOOUUUUUUUUYYNC'
                )
              ),
              '[^a-z0-9]+',
              '-',
              'g'
            ),
            '-+',
            '-',
            'g'
          )
        );
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS crawl CASCADE`);
  }
}
