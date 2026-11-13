import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncVehiclePublisherFromMembership1794597217953
  implements MigrationInterface
{
  name = "SyncVehiclePublisherFromMembership1794597217953";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE vehicles v
      SET
        publisher_type = 'dealership',
        dealership_id = dm.dealership_id
      FROM dealership_members dm
      WHERE v.profile_id = dm.profile_id
        AND (
          v.publisher_type::text IS DISTINCT FROM 'dealership'
          OR v.dealership_id IS DISTINCT FROM dm.dealership_id
        )
    `);

    await queryRunner.query(`
      UPDATE vehicles v
      SET
        publisher_type = 'particular',
        dealership_id = NULL
      WHERE NOT EXISTS (
        SELECT 1
        FROM dealership_members dm
        WHERE dm.profile_id = v.profile_id
      )
      AND (
        v.publisher_type::text IS DISTINCT FROM 'particular'
        OR v.dealership_id IS NOT NULL
      )
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No se puede restaurar el publisher_type histórico por anuncio.
  }
}
