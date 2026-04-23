import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

/**
 * La migración 1776925109682 quitó la FK (con ON DELETE CASCADE) de `vehicle_id` y añadió
 * la columna `vehicleId` con CASCADE. La app inserta en `vehicle_id`, no en `vehicleId`,
 * así que al borrar un vehículo el CASCADE afectaba a la columna equivocada o no aplica.
 * Esta migración: elimina `vehicleId` y su FK, y vuelve a poner un único FK
 * en `vehicle_id` → `vehicles` / `vehicle_entity` con ON DELETE CASCADE.
 */
export class VehicleImagesVehicleIdCascadeFk1778000000000 implements MigrationInterface {
  name = "VehicleImagesVehicleIdCascadeFk1778000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    )) as { table_name: string }[];
    const allNames = new Set(rows.map((r) => r.table_name));

    const child_table = ["vehicle_images", "vehicle_images_entity"].find((n) => allNames.has(n)) ?? null;
    const parent_table = ["vehicles", "vehicle_entity"].find((n) => allNames.has(n)) ?? null;
    if (!child_table || !parent_table) {
      return;
    }

    let table = await queryRunner.getTable(child_table);
    if (!table) {
      return;
    }

    for (const fk of [...table.foreignKeys]) {
      const is_vehicle_fk = fk.referencedTableName === parent_table;
      const is_vehicle_fk_col =
        fk.columnNames.includes("vehicle_id") || fk.columnNames.includes("vehicleId");
      if (is_vehicle_fk && is_vehicle_fk_col) {
        await queryRunner.dropForeignKey(child_table, fk);
      }
    }

    table = await queryRunner.getTable(child_table);
    if (table?.findColumnByName("vehicleId")) {
      await queryRunner.dropColumn(child_table, "vehicleId");
    }

    table = await queryRunner.getTable(child_table);
    if (!table?.findColumnByName("vehicle_id")) {
      return;
    }

    if (table.foreignKeys.some((fk) => fk.name === "FK_vehicle_images_vehicle_cascade")) {
      return;
    }

    await queryRunner.createForeignKey(
      child_table,
      new TableForeignKey({
        name: "FK_vehicle_images_vehicle_cascade",
        columnNames: ["vehicle_id"],
        referencedTableName: parent_table,
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
        onUpdate: "NO ACTION",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const child of ["vehicle_images", "vehicle_images_entity"]) {
      const table = await queryRunner.getTable(child);
      if (!table) {
        continue;
      }
      const fk = table.foreignKeys.find((f) => f.name === "FK_vehicle_images_vehicle_cascade");
      if (fk) {
        await queryRunner.dropForeignKey(child, fk);
      }
    }
  }
}
