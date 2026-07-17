# Arquitectura Nest lite

El backend usa **NestJS clásico por bounded context** (como `contexts/auth/`). No hay capas hexagonales `domain/` / `application/*-use-case/` / `infrastructure/`.

## Estructura física (obligatoria)

```text
contexts/<feature>/
  <feature>.module.ts
  api/                 # controllers (+ route.constants si aplica)
  dto/                 # HTTP DTOs (class-validator) y DTOs internos de servicio
  services/            # lógica de aplicación
  entities/            # TypeORM entities (campos snake_case)
  repositories/        # wrappers TypeORM concretos (SIN puerto abstracto)
  clients/             # solo APIs/SDK externos (ApiVehiculo, Stripe, Minio, OpenSearch…)
  exceptions/          # errores de aplicación
  types/               # read-models, filtros, enums, clases de dominio absorbidas
  ports/               # opcional: tokens abstractos solo para adapters externos
  guards/ queues/ processors/ gateways/ decorators/ …
```

Globs TypeORM (`data-source` / `migrations-source`): `**/*.entity{.ts,.js}` — las entities pueden vivir en cualquier carpeta bajo `src/` mientras el nombre termine en `.entity.ts`.

## Reglas

| Antes (hex, eliminado)                                   | Ahora (Nest lite)                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Carpeta `*-use-case/` por acción                         | Métodos en un `*Service`                                                         |
| `abstract class XxxRepository` + `provide`/`useExisting` | Inyectar el repo concreto (`TypeOrmXxxRepository`) o `@InjectRepository(Entity)` |
| Port + adapter para repos locales                        | Prohibido para TypeORM local                                                     |
| `clients/` / `ports/`                                    | Solo para HTTP/SDK externos reales                                               |
| Entidad de dominio + entidad ORM                         | ORM en `entities/`; formas/helpers en `types/` si hace falta                     |
| Controllers en `infrastructure/http-api/`                | Controllers en `api/`                                                            |

### Cuándo usar `clients/` / `ports/`

- **Sí:** Minio, Stripe, OpenSearch, ApiVehiculo, notificaciones push/SMS stub, etc.
- **No:** repositorios TypeORM ni “puertos” inventados para persistencia local.

### Naming

- Métodos/variables: **camelCase**.
- Campos de entidades TypeORM: **snake_case** (única excepción).
- Preferir `interface` para objetos/contratos; `type` solo para unions/mapped types.
- Updates: **`preload()` + `save()`**.
- Contratos HTTP: idénticos al migrar.

### Congelar

- Features nuevas solo en Nest lite.
- **No crear** `*-use-case/`, `domain/`, `infrastructure/` ni `abstract class XxxRepository`.

## Checklist de feature nueva

1. Inventariar contrato HTTP (ruta, método, status, body/query, guards).
2. `*Service` + DTOs en `dto/`.
3. Controller en `api/` llama al service (mismo JSON).
4. Persistencia: `@InjectRepository` o repo concreto en `repositories/`.
5. Externo: `clients/` (+ `ports/` solo si hace falta token DI).
6. Registrar en el module del feature.
7. Smoke manual del endpoint (suite de tests aparte).

## Estado de migración

Completado el barrido estructural:

- Leftovers de use-cases (vehicle-ai, images, prices, search, locations, shared/file) → `services/`.
- Puertos abstractos `*Repository` colapsados a implementaciones TypeORM / OpenSearch concretas.
- Relocate: `http-api`→`api`, `persistence`→`entities`, repos/queues/guards/gateways/adapters→raíz Nest lite.
- Husks `domain/` / `application/` / `infrastructure/` y `contexts/catalog/` vacío eliminados.

### Leftovers justificados (no hex de repos)

Tokens `provide: …Port` que quedan a propósito para adapters externos:

- `FileStoragePort`, `FileQueuePort`, `TempStoragePromotionPort`, `ImageStorageFinalizationPort`, `VideoProcessorPort` (Minio/ffmpeg/colas).
- `AlertPushNotificationPort`, `AlertSmsNotificationPort` (stubs).
- `ActiveFiltersLookupPort`, `PublishedVehicleSnapshotPort`, `ReverseGeocodingPort` (vehicles).
- `ChatParticipantLookupPort` (lookup de perfiles para chat).

No reintroducir `abstract class XxxRepository`.
