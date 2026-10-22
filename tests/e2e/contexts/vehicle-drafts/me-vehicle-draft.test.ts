/// <reference types="vite/client" />
import { randomUUID } from "node:crypto";

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Request } from "express";
import request from "supertest";
import { DataSource, getMetadataArgsStorage } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Los getters reales hacen require() nativo de un .ts, que vitest no transforma.
vi.mock("@/src/contexts/vehicles/entities/vehicle-images-entity.relation-type", async () => {
  const { getMetadataArgsStorage: storage } =
    await vi.importActual<{ getMetadataArgsStorage: typeof getMetadataArgsStorage }>("typeorm");
  return {
    get_vehicle_images_entity: () =>
      storage().tables.find(
        table => typeof table.target === "function" && table.target.name === "VehicleImagesEntity",
      )?.target,
  };
});

vi.mock("@/src/contexts/vehicles/entities/vehicle-prices-entity.relation-type", async () => {
  const { getMetadataArgsStorage: storage } =
    await vi.importActual<{ getMetadataArgsStorage: typeof getMetadataArgsStorage }>("typeorm");
  return {
    get_vehicle_prices_entity: () =>
      storage().tables.find(
        table => typeof table.target === "function" && table.target.name === "VehiclePriceEntity",
      )?.target,
  };
});

import { JSON_BODY_LIMIT } from "@/src/common/json-body-limit";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { HttpErrorFilter } from "@/src/contexts/shared/exceptions/HttpErrorFilter";
import { ResponseInterceptor } from "@/src/contexts/shared/interceptors/response.interceptor";
import { V1_VEHICLE_DRAFTS } from "@/src/contexts/vehicle-drafts/api/route.constants";
import {
  VEHICLE_DRAFT_MAX_VALUES_BYTES,
  VEHICLE_DRAFT_TTL_MS,
} from "@/src/contexts/vehicle-drafts/constants/vehicle-draft.constants";
import { VehicleDraftEntity } from "@/src/contexts/vehicle-drafts/entities/vehicle-draft.entity";
import { VehicleDraftsModule } from "@/src/contexts/vehicle-drafts/vehicle-drafts.module";

/** Requiere una BD con las migraciones aplicadas, p. ej. la de docker-compose. */
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;

const ROUTE = `/${V1_VEHICLE_DRAFTS}/me`;

/** Sustituye la estrategia JWT (sesiones, refresh tokens, Redis): el token es el profile id. */
@Injectable()
class BearerProfileIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const profileId = req.headers.authorization?.replace(/^Bearer /, "");

    if (!profileId) {
      throw new UnauthorizedException();
    }

    req.user = { id: profileId } as Request["user"];
    return true;
  }
}

const loadAllEntities = async () => {
  const entityModules = import.meta.glob("/src/**/*.entity.ts");
  await Promise.all(Object.values(entityModules).map(loadModule => loadModule()));

  return getMetadataArgsStorage().tables.map(table => table.target);
};

describe.runIf(Boolean(e2eDatabaseUrl))("v1/vehicle-drafts/me", () => {
  const profileId = randomUUID();
  const auth = `Bearer ${profileId}`;
  let app: NestExpressApplication;
  let dataSource: DataSource;

  const countDrafts = () =>
    dataSource.getRepository(VehicleDraftEntity).countBy({ profile_id: profileId });

  beforeAll(async () => {
    const entities = await loadAllEntities();

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          url: e2eDatabaseUrl,
          entities,
          synchronize: false,
          retryAttempts: 0,
        }),
        VehicleDraftsModule,
      ],
    })
      .overrideGuard(JwtGuard)
      .useClass(BearerProfileIdGuard)
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({
      rawBody: true,
      logger: false,
    });
    app.useBodyParser("json", { limit: JSON_BODY_LIMIT });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpErrorFilter());
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.query(`INSERT INTO "users" ("id", "email") VALUES ($1, $2)`, [
      profileId,
      `vehicle-drafts-e2e-${profileId}@example.com`,
    ]);
    await dataSource.query(`INSERT INTO "profile" ("id", "name") VALUES ($1, $2)`, [
      profileId,
      "E2E borradores",
    ]);
  }, 60_000);

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.query(`DELETE FROM "profile" WHERE "id" = $1`, [profileId]);
      await dataSource.query(`DELETE FROM "users" WHERE "id" = $1`, [profileId]);
    }
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.getRepository(VehicleDraftEntity).delete({ profile_id: profileId });
  });

  it("responde 401 sin token en GET, PUT y DELETE", async () => {
    const server = app.getHttpServer();

    await request(server).get(ROUTE).expect(401);
    await request(server).put(ROUTE).send({ values: {} }).expect(401);
    await request(server).delete(ROUTE).expect(401);
  });

  it("GET devuelve null si no hay borrador", async () => {
    const response = await request(app.getHttpServer())
      .get(ROUTE)
      .set("Authorization", auth)
      .expect(200);

    expect(response.body.data).toBeNull();
  });

  it("PUT dos veces deja una sola fila y GET devuelve el último snapshot", async () => {
    const server = app.getHttpServer();
    const appraisalId = randomUUID();

    const first = await request(server)
      .put(ROUTE)
      .set("Authorization", auth)
      .send({ values: { title: "Seat Ibiza" }, step: 1, appraisal_id: appraisalId })
      .expect(200);

    const second = await request(server)
      .put(ROUTE)
      .set("Authorization", auth)
      .send({ values: { title: "Seat Ibiza FR", price: 12_500 }, step: 2 })
      .expect(200);

    expect(second.body.data.id).toBe(first.body.data.id);
    expect(await countDrafts()).toBe(1);

    const response = await request(server)
      .get(ROUTE)
      .set("Authorization", auth)
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: first.body.data.id,
      profile_id: profileId,
      values: { title: "Seat Ibiza FR", price: 12_500 },
      step: 2,
      appraisal_id: appraisalId,
    });
    expect(response.body.data.created_at).toEqual(expect.any(String));
    expect(response.body.data.updated_at).toEqual(expect.any(String));
  });

  it("PUT acepta step y appraisal_id a null", async () => {
    const response = await request(app.getHttpServer())
      .put(ROUTE)
      .set("Authorization", auth)
      .send({ values: { title: "Golf" }, step: null, appraisal_id: null })
      .expect(200);

    expect(response.body.data).toMatchObject({ step: null, appraisal_id: null });
  });

  it("DELETE responde 204 y elimina el borrador", async () => {
    const server = app.getHttpServer();
    await request(server)
      .put(ROUTE)
      .set("Authorization", auth)
      .send({ values: { title: "León" } })
      .expect(200);

    await request(server).delete(ROUTE).set("Authorization", auth).expect(204);

    expect(await countDrafts()).toBe(0);
    await request(server).delete(ROUTE).set("Authorization", auth).expect(204);
  });

  it("GET borra y devuelve null si el borrador caducó", async () => {
    const server = app.getHttpServer();
    await request(server)
      .put(ROUTE)
      .set("Authorization", auth)
      .send({ values: { title: "Clio" } })
      .expect(200);
    await dataSource.query(
      `UPDATE "vehicle_drafts" SET "updated_at" = $1 WHERE "profile_id" = $2`,
      [new Date(Date.now() - VEHICLE_DRAFT_TTL_MS - 60_000), profileId],
    );

    const response = await request(server)
      .get(ROUTE)
      .set("Authorization", auth)
      .expect(200);

    expect(response.body.data).toBeNull();
    expect(await countDrafts()).toBe(0);
  });

  it("PUT responde 400 si values supera 200 KB", async () => {
    const response = await request(app.getHttpServer())
      .put(ROUTE)
      .set("Authorization", auth)
      .send({ values: { description: "x".repeat(VEHICLE_DRAFT_MAX_VALUES_BYTES + 1) } })
      .expect(400);

    expect(response.body.message).toContain("demasiado grande");
    expect(await countDrafts()).toBe(0);
  });

  it("PUT responde 400 si el body no es válido", async () => {
    const server = app.getHttpServer();

    await request(server)
      .put(ROUTE)
      .set("Authorization", auth)
      .send({ values: ["no", "objeto"] })
      .expect(400);
    await request(server)
      .put(ROUTE)
      .set("Authorization", auth)
      .send({ values: {}, step: -1 })
      .expect(400);
    await request(server)
      .put(ROUTE)
      .set("Authorization", auth)
      .send({ values: {}, appraisal_id: "no-es-uuid" })
      .expect(400);
  });
});
