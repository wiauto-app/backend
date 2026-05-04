/**
 * Añade bloques `response` (ejemplos) a cada request de la colección Postman
 * cuando aún no tienen ninguno. No modifica ejemplos ya definidos manualmente.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.dirname(__dirname);
const file = path.join(root, "postman", "wiauto.postman_collection.json");

const iso = "2026-04-29T14:30:00.000Z";

function normalizePath(raw) {
  let s = raw
    .replace(/^\{\{\s*base_url\s*\}\}/i, "")
    .replace(/^https?:\/\/[^/]+/i, "")
    .trim();
  const q = s.indexOf("?");
  if (q >= 0) s = s.slice(0, q);
  s = s.replace(/\/+$/, "") || "/";
  return s.startsWith("/") ? s.slice(1) : s;
}

function jsonBody(obj) {
  return JSON.stringify(obj, null, 2);
}

function textBody(s) {
  return s;
}

function makeExample(
  name,
  req,
  { code = 200, status = "OK", body, language = "json", headers, emptyBody = false } = {},
) {
  if (emptyBody) {
    return {
      name,
      originalRequest: {
        method: req.method,
        header: req.header ?? [],
        url: req.url,
        body: req.body,
        description: req.description,
      },
      status: status || "OK",
      code,
      _postman_previewlanguage: "text",
      header: [],
      body: "",
    };
  }
  const hdrs = headers ?? [
    { key: "Content-Type", value: "application/json; charset=utf-8" },
  ];
  if (code === 204) {
    return {
      name,
      originalRequest: {
        method: req.method,
        header: req.header ?? [],
        url: req.url,
        body: req.body,
        description: req.description,
      },
      status: "No Content",
      code: 204,
      _postman_previewlanguage: "text",
      header: [],
      body: "",
    };
  }
  if (code === 302) {
    return {
      name,
      originalRequest: {
        method: req.method,
        header: req.header ?? [],
        url: req.url,
        body: req.body,
        description: req.description,
      },
      status: "Found",
      code: 302,
      _postman_previewlanguage: "html",
      header: [
        { key: "Location", value: "https://accounts.google.com/o/oauth2/v2/auth?..." },
      ],
      body: "<!-- Redirección al proveedor OAuth -->",
    };
  }
  return {
    name,
    originalRequest: {
      method: req.method,
      header: req.header ?? [],
      url: req.url,
      body: req.body,
      description: req.description,
    },
    status,
    code,
    _postman_previewlanguage: language,
    header: hdrs,
    body: typeof body === "string" ? body : jsonBody(body),
  };
}

const vehicle_primitive = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  price: 25000,
  mileage: 45000,
  lat: -12.0464,
  lng: -77.0428,
  condition: "used",
  title: "Toyota ejemplo venta",
  description:
    "Descripción del anuncio con al menos diez caracteres para pasar validación.",
  publisher_type: "professional",
  version_id: 1,
  status: "active",
  is_featured: false,
  expires_at: "2026-07-28T14:30:00.000Z",
  views: 42,
  transmission_type: "automatic",
  traction_id: "cccccccc-dddd-eeee-ffff-000000000099",
  power: 150,
  displacement: 2000,
  autonomy: 0,
  battery_capacity: 0,
  time_to_charge: 0,
  license_plate: "",
  phone_code: "+51",
  phone: "999999999",
  email: "vendedor@ejemplo.com",
  created_at: iso,
  updated_at: iso,
  features_ids: ["aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"],
  services_ids: ["bbbbbbbb-cccc-dddd-eeee-ffffffffffff"],
  vehicle_type_id: "cccccccc-dddd-eeee-ffff-000000000001",
  color_id: "dddddddd-eeee-ffff-0000-111111111111",
  dgt_label_id: "eeeeeeee-ffff-0000-1111-222222222222",
  warranty_type_id: "ffffffff-0000-1111-2222-333333333333",
  cuota_ids: ["00000000-1111-2222-3333-444444444444"],
  suggestions: [],
};

const feature_obj = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  name: "Aire acondicionado",
  slug: "aire-acondicionado",
  created_at: iso,
  updated_at: iso,
};

function resolveResponses(method, pathKey, req) {
  const m = method.toUpperCase();

  const table = {
    "GET|auth/me": () =>
      makeExample("200 OK — perfil (ejemplo)", req, {
        body: {
          id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          email: "usuario@ejemplo.com",
          provider: "local",
          name: "Nombre",
          last_name: "Apellido",
          avatar_url: "https://cdn.ejemplo/avatar.png",
          last_sign_in: iso,
          created_at: iso,
        },
      }),

    "GET|auth/google": () =>
      makeExample("302 Found — redirección OAuth (ejemplo)", req, { code: 302 }),

    "POST|auth/login": () =>
      makeExample("200 OK — sesión directa (ejemplo)", req, {
        body: {
          type: "session",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      }),

    "POST|auth/google/mobile": () =>
      makeExample("200 OK — token JWT (ejemplo)", req, {
        body: {
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      }),

    "GET|2fa/setup": () =>
      makeExample("200 OK — QR y otpauth (ejemplo)", req, {
        body: {
          otpauth_url:
            "otpauth://totp/wiauto:usuario@ejemplo.com?secret=ABCD...&issuer=wiauto",
          qr_code_data_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
        },
      }),

    "POST|2fa/activate": () =>
      makeExample("200 OK — 2FA activado (ejemplo)", req, {
        body: {
          verified: true,
          message: "Se ha habilitado el autenticador correctamente",
          backup_codes: ["KNSQ-SMS8", "N56N-HQHV"],
        },
      }),

    "POST|2fa/enable": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: { message: "Se ha habilitado el autenticador correctamente" },
      }),

    "POST|2fa/disable": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: { message: "Se ha deshabilitado el autenticador correctamente" },
      }),

    "DELETE|2fa/delete": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: { message: "Se ha eliminado el autenticador correctamente" },
      }),

    "POST|2fa/validate-backup-code": () =>
      makeExample("200 OK — token de sesión (ejemplo)", req, {
        body: {
          message: "Código de respaldo validado correctamente",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      }),

    "GET|2fa/regenerate-backup-codes": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          message: "Códigos de respaldo regenerados correctamente",
          backup_codes: ["KNSQ-SMS8", "N56N-HQHV", "BX23-G2WL"],
        },
      }),

    "GET|users": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: { users: "ok" },
      }),

    "POST|users": () =>
      makeExample("201 Created — usuario (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          message: "Usuario creado correctamente",
          data: {
            id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            email: "nuevo@ejemplo.com",
            provider: "local",
            provider_id: null,
            password: null,
            is_email_verified: false,
            two_factor_enabled: false,
            last_sign_in: null,
            created_at: iso,
          },
        },
      }),

    "POST|auth/email-verification/confirm": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          message: "Correo verificado correctamente. Ya podés iniciar sesión.",
        },
      }),

    "POST|auth/email-verification/resend": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          message: "Te enviamos un nuevo correo con el enlace de verificación.",
        },
      }),

    "POST|auth/password-recovery/request": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          message:
            "Si el email está registrado, vas a recibir un correo con instrucciones.",
        },
      }),

    "POST|auth/password-recovery/change": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: { message: "Contraseña actualizada correctamente." },
      }),

    "POST|v1/vehicles": () =>
      makeExample("201 Created — vehicle (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: { vehicle: vehicle_primitive },
      }),

    "GET|v1/vehicles": () =>
      makeExample("200 OK — listado paginado (ejemplo)", req, {
        body: {
          vehicles: [
            {
              id: vehicle_primitive.id,
              price: vehicle_primitive.price,
              mileage: vehicle_primitive.mileage,
              lat: vehicle_primitive.lat,
              lng: vehicle_primitive.lng,
              condition: vehicle_primitive.condition,
              title: vehicle_primitive.title,
              created_at: vehicle_primitive.created_at,
              images: [
                {
                  id: "11111111-2222-3333-4444-555555555555",
                  url: "https://storage.ejemplo/vehicles/imagen-principal.jpg",
                },
              ],
              features: [feature_obj],
              services: [
                {
                  id: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
                  name: "Financiamiento",
                  slug: "financiamiento",
                },
              ],
              vehicle_type: {
                id: "cccccccc-dddd-eeee-ffff-000000000001",
                name: "SUV",
                slug: "suv",
              },
              color: {
                id: "dddddddd-eeee-ffff-0000-111111111111",
                name: "Rojo pasión",
                slug: "rojo-pasion",
                hex_code: "#E02020",
              },
              dgt_label: {
                id: "eeeeeeee-ffff-0000-1111-222222222222",
                name: "Etiqueta 0 emisiones",
                code: "0",
                slug: "etiqueta-0-emisiones",
              },
              warranty_type: {
                id: "ffffffff-0000-1111-2222-333333333333",
                name: "Garantía oficial fabricante",
                slug: "garantia-oficial-fabricante",
              },
              cuotas: [
                {
                  id: "00000000-1111-2222-3333-444444444444",
                  name: "Financiación 48 meses",
                  slug: "financiacion-48-meses",
                  value: 48,
                },
              ],
            },
          ],
          total_count: 1,
        },
      }),

    "GET|v1/vehicles/:vehicle_id": () =>
      makeExample("200 OK — detalle vehicle (ejemplo)", req, {
        body: { vehicle: vehicle_primitive },
      }),

    "PATCH|v1/vehicles/:vehicle_id": () =>
      makeExample("200 OK — vehicle actualizado (ejemplo)", req, {
        body: {
          vehicle: {
            ...vehicle_primitive,
            price: 26000,
            mileage: 46000,
            title: "Título actualizado mínimo cinco chars",
          },
        },
      }),

    "DELETE|v1/vehicles/:vehicle_id": () =>
      makeExample("204 No Content (ejemplo)", req, { code: 204 }),

    "POST|v1/vehicle-images/upload/:vehicle_id": () =>
      makeExample("201 Created — imagen (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          image: {
            id: "11111111-2222-3333-4444-555555555555",
            url: "https://storage.ejemplo/vehicles/foto.jpg",
            vehicle_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "POST|v1/vehicle-images/bulk/:vehicle_id": () =>
      makeExample("200 OK — cola de subida (ejemplo)", req, {
        body: { message: "Las imágenes se están subiendo en segundo plano" },
      }),

    "POST|v1/generate-video-signed-url": () =>
      makeExample("200 OK — URL prefirmada (ejemplo)", req, {
        body: textBody(
          '"https://minio.ejemplo/videos/mi-video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&..."',
        ),
        language: "json",
      }),

    "POST|v1/confirm-video-upload": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          file_key: "videos/anuncio-123/original.webm",
          file_key_en_storage: "videos/anuncio-123/original.mp4",
        },
      }),

    "POST|v1/features": () =>
      makeExample("201 Created — feature en raíz (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: feature_obj,
      }),

    "GET|v1/features": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: { features: [feature_obj] },
      }),

    "GET|v1/features/:feature_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: { feature: feature_obj },
      }),

    "PATCH|v1/features": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          feature: {
            ...feature_obj,
            name: "Climatizador bizona",
            slug: "climatizador-bizona",
          },
        },
      }),

    "DELETE|v1/features/:feature_id": () =>
      makeExample("200 OK — sin cuerpo (ejemplo)", req, { emptyBody: true }),

    "POST|v1/vehicle-types": () =>
      makeExample("201 Created (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          vehicleType: {
            id: "cccccccc-dddd-eeee-ffff-000000000001",
            name: "SUV",
            slug: "suv",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "GET|v1/vehicle-types": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          vehicleTypes: [
            {
              id: "cccccccc-dddd-eeee-ffff-000000000001",
              name: "SUV",
              slug: "suv",
              created_at: iso,
              updated_at: iso,
            },
          ],
        },
      }),

    "GET|v1/vehicle-types/:vehicle_type_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          vehicleType: {
            id: "cccccccc-dddd-eeee-ffff-000000000001",
            name: "SUV",
            slug: "suv",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "PATCH|v1/vehicle-types/:vehicle_type_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          vehicleType: {
            id: "cccccccc-dddd-eeee-ffff-000000000001",
            name: "Todoterreno",
            slug: "todoterreno",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "DELETE|v1/vehicle-types/:vehicle_type_id": () =>
      makeExample("200 OK — sin cuerpo (ejemplo)", req, { emptyBody: true }),

    "POST|v1/services": () =>
      makeExample("201 Created (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          service: {
            id: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
            name: "Financiamiento",
            description: "Opciones de crédito y cuotas",
            slug: "financiamiento",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "GET|v1/services": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          services: [
            {
              id: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
              name: "Financiamiento",
              description: "Opciones de crédito y cuotas",
              slug: "financiamiento",
              created_at: iso,
              updated_at: iso,
            },
          ],
        },
      }),

    "GET|v1/services/:service_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          service: {
            id: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
            name: "Financiamiento",
            description: "Opciones de crédito y cuotas",
            slug: "financiamiento",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "PATCH|v1/services/:service_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          service: {
            id: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
            name: "Financiamiento premium",
            description: "Crédito directo y tasas preferentes",
            slug: "financiamiento-premium",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "DELETE|v1/services/:service_id": () =>
      makeExample("200 OK — sin cuerpo (ejemplo)", req, { emptyBody: true }),

    "POST|v1/dgt-labels": () =>
      makeExample("201 Created (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          dgt_label: {
            id: "eeeeeeee-ffff-0000-1111-222222222222",
            name: "Etiqueta 0 emisiones",
            code: "0",
            description: "Vehículos de cero emisiones.",
            slug: "etiqueta-0-emisiones",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "GET|v1/dgt-labels": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          dgt_labels: [
            {
              id: "eeeeeeee-ffff-0000-1111-222222222222",
              name: "Etiqueta 0 emisiones",
              code: "0",
              description: "Vehículos de cero emisiones.",
              slug: "etiqueta-0-emisiones",
              created_at: iso,
              updated_at: iso,
            },
          ],
        },
      }),

    "GET|v1/dgt-labels/:dgt_label_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          dgt_label: {
            id: "eeeeeeee-ffff-0000-1111-222222222222",
            name: "Etiqueta 0 emisiones",
            code: "0",
            description: "Vehículos de cero emisiones.",
            slug: "etiqueta-0-emisiones",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "PATCH|v1/dgt-labels/:dgt_label_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          dgt_label: {
            id: "eeeeeeee-ffff-0000-1111-222222222222",
            name: "Etiqueta 0 emisiones",
            code: "0",
            description: "Texto actualizado de la etiqueta.",
            slug: "etiqueta-0-emisiones",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "DELETE|v1/dgt-labels/:dgt_label_id": () =>
      makeExample("200 OK — sin cuerpo (ejemplo)", req, { emptyBody: true }),

    "POST|v1/warranty-types": () =>
      makeExample("201 Created (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          warranty_type: {
            id: "ffffffff-0000-1111-2222-333333333333",
            name: "Garantía oficial fabricante",
            description: "Cobertura según condiciones del fabricante.",
            slug: "garantia-oficial-fabricante",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "GET|v1/warranty-types": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          warranty_types: [
            {
              id: "ffffffff-0000-1111-2222-333333333333",
              name: "Garantía oficial fabricante",
              description: "Cobertura según condiciones del fabricante.",
              slug: "garantia-oficial-fabricante",
              created_at: iso,
              updated_at: iso,
            },
          ],
        },
      }),

    "GET|v1/warranty-types/:warranty_type_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          warranty_type: {
            id: "ffffffff-0000-1111-2222-333333333333",
            name: "Garantía oficial fabricante",
            description: "Cobertura según condiciones del fabricante.",
            slug: "garantia-oficial-fabricante",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "PATCH|v1/warranty-types/:warranty_type_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          warranty_type: {
            id: "ffffffff-0000-1111-2222-333333333333",
            name: "Garantía oficial fabricante",
            description: "Descripción actualizada del tipo de garantía.",
            slug: "garantia-oficial-fabricante",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "DELETE|v1/warranty-types/:warranty_type_id": () =>
      makeExample("200 OK — sin cuerpo (ejemplo)", req, { emptyBody: true }),

    "POST|v1/cuotas": () =>
      makeExample("201 Created (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          cuota: {
            id: "00000000-1111-2222-3333-444444444444",
            name: "Financiación 48 meses",
            slug: "financiacion-48-meses",
            value: 48,
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "GET|v1/cuotas": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          cuotas: [
            {
              id: "00000000-1111-2222-3333-444444444444",
              name: "Financiación 48 meses",
              slug: "financiacion-48-meses",
              value: 48,
              created_at: iso,
              updated_at: iso,
            },
          ],
        },
      }),

    "GET|v1/cuotas/:cuota_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          cuota: {
            id: "00000000-1111-2222-3333-444444444444",
            name: "Financiación 48 meses",
            slug: "financiacion-48-meses",
            value: 48,
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "PATCH|v1/cuotas/:cuota_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          cuota: {
            id: "00000000-1111-2222-3333-444444444444",
            name: "Financiación 60 meses",
            slug: "financiacion-60-meses",
            value: 60,
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "DELETE|v1/cuotas/:cuota_id": () =>
      makeExample("200 OK — sin cuerpo (ejemplo)", req, { emptyBody: true }),

    "POST|v1/colors": () =>
      makeExample("201 Created (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          color: {
            id: "dddddddd-eeee-ffff-0000-111111111111",
            name: "Rojo pasión",
            hex_code: "#E02020",
            slug: "rojo-pasion",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "GET|v1/colors": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          colors: [
            {
              id: "dddddddd-eeee-ffff-0000-111111111111",
              name: "Rojo pasión",
              hex_code: "#E02020",
              slug: "rojo-pasion",
              created_at: iso,
              updated_at: iso,
            },
          ],
        },
      }),

    "GET|v1/colors/:color_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          color: {
            id: "dddddddd-eeee-ffff-0000-111111111111",
            name: "Rojo pasión",
            hex_code: "#E02020",
            slug: "rojo-pasion",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "PATCH|v1/colors/:color_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          color: {
            id: "dddddddd-eeee-ffff-0000-111111111111",
            name: "Rojo rubí",
            hex_code: "#E02020",
            slug: "rojo-rubi",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "DELETE|v1/colors/:color_id": () =>
      makeExample("200 OK — sin cuerpo (ejemplo)", req, { emptyBody: true }),

    "POST|v1/tractions": () =>
      makeExample("201 Created (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          traction: {
            id: "cccccccc-dddd-eeee-ffff-000000000099",
            name: "4x4",
            slug: "4x4",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "GET|v1/tractions": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          tractions: [
            {
              id: "cccccccc-dddd-eeee-ffff-000000000099",
              name: "4x4",
              slug: "4x4",
              created_at: iso,
              updated_at: iso,
            },
          ],
        },
      }),

    "GET|v1/tractions/:traction_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          traction: {
            id: "cccccccc-dddd-eeee-ffff-000000000099",
            name: "4x4",
            slug: "4x4",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "PATCH|v1/tractions/:traction_id": () =>
      makeExample("200 OK (ejemplo)", req, {
        body: {
          traction: {
            id: "cccccccc-dddd-eeee-ffff-000000000099",
            name: "AWD",
            slug: "awd",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "DELETE|v1/tractions/:traction_id": () =>
      makeExample("200 OK — sin cuerpo (ejemplo)", req, { emptyBody: true }),

    "POST|v1/reviews": () =>
      makeExample("201 Created — reseña (ejemplo)", req, {
        code: 201,
        status: "Created",
        body: {
          review: {
            id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            rating: 5,
            comment: "Trato excelente y vehículo como en el anuncio.",
            profile_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            vehicle_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            created_at: iso,
            updated_at: iso,
          },
        },
      }),

    "GET|v1/reviews": () =>
      makeExample("200 OK — reseñas paginadas (ejemplo)", req, {
        body: {
          data: [
            {
              id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
              rating: 5,
              comment: "Trato excelente y vehículo como en el anuncio.",
              profile_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
              vehicle_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
              created_at: iso,
              updated_at: iso,
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      }),
  };

  function toPattern(p) {
    const parts = p.split("/").filter(Boolean);
    const out = [];
    for (const seg of parts) {
      if (
        seg.startsWith("{{") ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          seg,
        ) ||
        /^\d+$/.test(seg)
      ) {
        const prev = out[out.length - 1] ?? "";
        if (prev === "vehicles") out.push(":vehicle_id");
        else if (prev === "features") out.push(":feature_id");
        else if (prev === "vehicle-types") out.push(":vehicle_type_id");
        else if (prev === "services") out.push(":service_id");
        else if (prev === "dgt-labels") out.push(":dgt_label_id");
        else if (prev === "warranty-types") out.push(":warranty_type_id");
        else if (prev === "cuotas") out.push(":cuota_id");
        else if (prev === "colors") out.push(":color_id");
        else if (prev === "tractions") out.push(":traction_id");
        else if (prev === "upload") out.push(":vehicle_id");
        else if (prev === "bulk") out.push(":vehicle_id");
        else out.push(":id");
      } else out.push(seg);
    }
    return out.join("/");
  }

  const pattern = toPattern(pathKey);
  const key = `${m}|${pattern}`;
  const fn = table[key];
  if (!fn) {
    console.warn("Sin ejemplo mapeado:", key);
    return null;
  }
  const ex = fn();
  return ex;
}

function walk(items) {
  for (const it of items ?? []) {
    if (it.item) walk(it.item);
    if (!it.request) continue;
    if (Array.isArray(it.response) && it.response.length > 0) continue;

    const raw =
      typeof it.request.url === "string"
        ? it.request.url
        : it.request.url?.raw ?? "";
    const pathKey = normalizePath(raw);
    const ex = resolveResponses(it.request.method, pathKey, it.request);
    if (ex) it.response = [ex];
  }
}

const col = JSON.parse(fs.readFileSync(file, "utf8"));
walk(col.item);

if (!col.item.some((x) => x.name === "sistema")) {
  col.item.push({
    name: "sistema",
    item: [
      {
        name: "health",
        request: {
          method: "GET",
          header: [],
          url: "{{base_url}}/health",
          description: "Comprobación de vida del API (`GET /health`). Sin autenticación.",
        },
        response: [
          {
            name: "200 OK (ejemplo)",
            originalRequest: {
              method: "GET",
              header: [],
              url: "{{base_url}}/health",
            },
            status: "OK",
            code: 200,
            _postman_previewlanguage: "json",
            header: [
              { key: "Content-Type", value: "application/json; charset=utf-8" },
            ],
            body: JSON.stringify({ status: "ok" }, null, 2),
          },
        ],
      },
    ],
  });
}

function findRequestItems(items, method, pathSuffix) {
  const out = [];
  for (const it of items ?? []) {
    if (it.item) out.push(...findRequestItems(it.item, method, pathSuffix));
    if (!it.request) continue;
    const raw =
      typeof it.request.url === "string"
        ? it.request.url
        : it.request.url?.raw ?? "";
    if (it.request.method === method && raw.includes(pathSuffix)) out.push(it);
  }
  return out;
}

const loginItems = findRequestItems(col.item, "POST", "/auth/login");
for (const it of loginItems) {
  const has2fa = it.response?.some((r) => r.name?.includes("2FA"));
  if (!has2fa) {
    it.response = it.response ?? [];
    it.response.push({
      name: "200 OK — requiere 2FA (ejemplo)",
      originalRequest: {
        method: "POST",
        header: it.request.header ?? [],
        url: it.request.url,
        body: it.request.body,
        description: it.request.description,
      },
      status: "OK",
      code: 200,
      _postman_previewlanguage: "json",
      header: [
        { key: "Content-Type", value: "application/json; charset=utf-8" },
      ],
      body: JSON.stringify(
        {
          type: "2fa_required",
          challenge_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
        null,
        2,
      ),
    });
  }
}

fs.writeFileSync(file, JSON.stringify(col, null, 2) + "\n");
console.log("Listo:", file);
