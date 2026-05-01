/**
 * Inserta vehículos de ejemplo (coordenadas en España) leyendo `scripts/data/spain-demo-vehicles.json`.
 * Usa `DATABASE_URL` del .env (misma que la app).
 *
 * Requisitos: al menos una fila en `version` con combustible no recargable (fuel_type.can_charge = false),
 * una en `tractions`, una en `vehicle_types`.
 *
 * Uso:
 *   pnpm seed:spain-demos
 *   pnpm seed:spain-demos -- --wipe-demo   (borra filas con email %@wiauto.test antes de insertar)
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- script CLI con driver pg */
/* eslint-disable unicorn/no-process-exit, @typescript-eslint/use-unknown-in-catch-callback-variable, unicorn/catch-error-name */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

config();

type powertrain_kind = "ice" | "ev";

interface demo_vehicle_row {
  label: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  price: number;
  mileage: number;
  condition: "new" | "used";
  publisher_type: "professional" | "particular";
  transmission_type: "manual" | "automatic";
  power: number;
  displacement: number;
  autonomy: number;
  battery_capacity: number;
  time_to_charge: number;
  phone_code: string;
  phone: string;
  email: string;
  license_plate: string;
  powertrain: powertrain_kind;
}

interface catalog_ids {
  version_ice_id: number;
  version_ev_id: number | null;
  traction_id: string;
  vehicle_type_id: string;
}

const dataset_path = path.join(__dirname, "data", "spain-demo-vehicles.json");

const wipe_demo = process.argv.includes("--wipe-demo");

async function load_catalog(client: Client): Promise<catalog_ids> {
  const ice_r = await client.query(
    `SELECT v.id AS id
     FROM version v
     INNER JOIN fuel_type ft ON ft.id = v.fuel_type_id
     WHERE ft.can_charge = false
     ORDER BY v.id ASC
     LIMIT 1`,
  );
  const ev_r = await client.query(
    `SELECT v.id AS id
     FROM version v
     INNER JOIN fuel_type ft ON ft.id = v.fuel_type_id
     WHERE ft.can_charge = true
     ORDER BY v.id ASC
     LIMIT 1`,
  );
  const tr_r = await client.query(
    `SELECT id FROM tractions ORDER BY created_at ASC LIMIT 1`,
  );
  const vt_r = await client.query(
    `SELECT id FROM vehicle_types ORDER BY created_at ASC LIMIT 1`,
  );

  if (!ice_r.rows[0]?.id) {
    throw new Error(
      "Catálogo: no hay ninguna version con fuel_type.can_charge = false (térmico).",
    );
  }
  if (!tr_r.rows[0]?.id) {
    throw new Error("Catálogo: tabla tractions vacía.");
  }
  if (!vt_r.rows[0]?.id) {
    throw new Error("Catálogo: tabla vehicle_types vacía.");
  }

  let version_ev_id: number | null = null;
  const ev_first = ev_r.rows[0];
  if (ev_first?.id != null) {
    version_ev_id = Number(ev_first.id);
  }

  return {
    version_ice_id: Number(ice_r.rows[0].id),
    version_ev_id,
    traction_id: String(tr_r.rows[0].id),
    vehicle_type_id: String(vt_r.rows[0].id),
  };
}

function version_for_row(
  row: demo_vehicle_row,
  catalog: catalog_ids,
): number {
  if (row.powertrain === "ev") {
    if (catalog.version_ev_id === null) {
      throw new Error(
        `Fila "${row.label}": powertrain ev pero no hay version eléctrica en catálogo.`,
      );
    }
    return catalog.version_ev_id;
  }
  return catalog.version_ice_id;
}

function assert_ev_numbers(row: demo_vehicle_row): void {
  if (row.displacement !== 0) {
    throw new Error(`${row.label}: EV requiere displacement 0 (regla de negocio).`);
  }
  if (row.autonomy <= 0 || row.battery_capacity <= 0) {
    throw new Error(`${row.label}: EV requiere autonomy y battery_capacity > 0.`);
  }
}

function assert_ice_numbers(row: demo_vehicle_row): void {
  if (row.displacement <= 0) {
    throw new Error(`${row.label}: térmico requiere displacement > 0.`);
  }
  if (row.autonomy !== 0 || row.battery_capacity !== 0 || row.time_to_charge !== 0) {
    throw new Error(
      `${row.label}: térmico debe llevar autonomy, battery_capacity y time_to_charge en 0.`,
    );
  }
}

async function main(): Promise<void> {
  const db_url = process.env.DATABASE_URL_MIGRATION;
  if (!db_url) {
    throw new Error("DATABASE_URL no definida (revisa .env).");
  }

  const raw = readFileSync(dataset_path, "utf8");
  const rows = JSON.parse(raw) as demo_vehicle_row[];

  const client = new Client({ connectionString: db_url });
  await client.connect();

  try {
    if (wipe_demo) {
      const sub = `SELECT id FROM vehicles WHERE email LIKE '%@wiauto.test'`;
      await client.query(`DELETE FROM vehicle_videos WHERE vehicle_id IN (${sub})`);
      await client.query(
        `DELETE FROM vehicle_features WHERE "vehiclesId" IN (${sub})`,
      );
      await client.query(
        `DELETE FROM vehicle_services WHERE "vehiclesId" IN (${sub})`,
      );
      const del = await client.query(`DELETE FROM vehicles WHERE email LIKE '%@wiauto.test'`);
      console.log(`wipe-demo: eliminadas ${del.rowCount ?? 0} filas.`);
    }

    const catalog = await load_catalog(client);
    const expires_at = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    for (const row of rows) {
      if (row.powertrain === "ev") {
        assert_ev_numbers(row);
      } else {
        assert_ice_numbers(row);
      }

      const version_id = version_for_row(row, catalog);
      const id = randomUUID();

      await client.query(
        `INSERT INTO vehicles (
          id, title, description, price, mileage, lat, lng, condition, status, is_featured, views,
          publisher_type, expires_at, transmission_type, power, displacement, autonomy, battery_capacity,
          time_to_charge, license_plate, phone_code, phone, email, version_id, traction_id, vehicle_type_id,
          suggestions, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::vehicles_condition_enum, $9::vehicles_status_enum, false, 0,
          $10::vehicles_publisher_type_enum, $11, $12::vehicles_transmission_type_enum, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22::integer, $23::uuid, $24::uuid, '[]'::jsonb, now(), now()
        )`,
        [
          id,
          row.title,
          row.description,
          row.price,
          row.mileage,
          row.lat,
          row.lng,
          row.condition,
          "active",
          row.publisher_type,
          expires_at,
          row.transmission_type,
          row.power,
          row.displacement,
          row.autonomy,
          row.battery_capacity,
          row.time_to_charge,
          row.license_plate,
          row.phone_code,
          row.phone,
          row.email,
          version_id,
          catalog.traction_id,
          catalog.vehicle_type_id,
        ],
      );

      console.log(`insertado [${row.label}] ${row.title} → ${id}`);
    }

    console.log(`Listo: ${rows.length} vehículos demo.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
