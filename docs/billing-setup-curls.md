# Billing — guía de setup con curls

Secuencia para configurar planes de suscripción, permisos premium y probar Stripe en local.

## Variables

```bash
export BASE_URL="http://localhost:4000"
export FRONTEND_URL="http://localhost:3000"
```

## 1. Login admin

```bash
curl -s -c cookies.txt -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"tu-password"}'
```

Usa la cookie de sesión en los siguientes requests (`-b cookies.txt`).

## 2. Permisos premium (si la migración no los insertó)

```bash
curl -s -b cookies.txt -X POST "$BASE_URL/v1/permissions" \
  -H "Content-Type: application/json" \
  -d '{"name":"Administrar planes","key":"billing.manage","value":1}'
```

Repite para: `vehicles.featured_monthly`, `vehicles.max_photos`, `alerts.max_active`, `analytics.view`, `vehicles.boost`.

## 3. Sincronizar archivo de keys TypeScript

```bash
curl -s -b cookies.txt -X POST "$BASE_URL/v1/permissions/sync-available-keys-file"
```

Regenera `src/contexts/users/permissions/lib/available-permission.ts`.

## 4. Crear roles Free / Pro

```bash
curl -s -b cookies.txt -X POST "$BASE_URL/v1/roles" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pro","is_admin":false,"is_developer":false}'
```

Asigna permisos al rol:

```bash
curl -s -b cookies.txt -X PUT "$BASE_URL/v1/roles/{role_id}/permissions" \
  -H "Content-Type: application/json" \
  -d '{"permission_ids":["uuid-vehicles-create","uuid-analytics-view"]}'
```

## 5. CRUD plan + sync Stripe

```bash
curl -s -b cookies.txt -X POST "$BASE_URL/v1/billing/plans" \
  -H "Content-Type: application/json" \
  -d '{
    "slug":"pro-mensual",
    "name":"Plan Pro",
    "audience":"professional",
    "billing_type":"recurring",
    "role_id":"{role_id}",
    "prices":[{"interval":"month","amount_cents":1990,"currency":"eur"}],
    "features":[{"label":"15 anuncios activos","included":true}]
  }'
```

Sincronizar con Stripe:

```bash
curl -s -b cookies.txt -X POST "$BASE_URL/v1/billing/plans/{plan_id}/sync-stripe"
```

## 6. Checkout de prueba (usuario autenticado)

Login como usuario vendedor, luego:

```bash
curl -s -b user-cookies.txt -X POST "$BASE_URL/v1/public/billing/checkout/subscription" \
  -H "Content-Type: application/json" \
  -d '{"plan_price_id":"{price_id}"}'
```

Abre `checkout_url` en el navegador. El endpoint público detecta la sesión JWT si envías cookies.

## 7. Checkout guest (sin sesión)

```bash
curl -s -X POST "$BASE_URL/v1/public/billing/checkout/subscription" \
  -H "Content-Type: application/json" \
  -d '{"plan_price_id":"{price_id}"}'
```

Stripe creará el customer en el checkout. Tras pagar, el webhook aprovisiona la cuenta (nueva o vinculada por email) y envía correo de bienvenida.

## 8. Webhook local con Stripe CLI

```bash
stripe listen --forward-to localhost:4000/v1/billing/webhooks/stripe
```

Copia el `whsec_...` que imprime Stripe CLI y configúralo en `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_test_...
```

Reinicia el backend tras cambiar `.env`.

### Eventos a activar en Stripe Dashboard

- `checkout.session.completed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### Customer Portal

Configura la cancelación en **at_period_end** (fin de periodo) en el Dashboard de Stripe o vía Billing Portal configuration.

## 9. Endpoints útiles

| Método | Ruta                                                     | Auth                   |
| ------ | -------------------------------------------------------- | ---------------------- |
| GET    | `/v1/billing/plans/catalog?audience=professional`        | JWT usuario            |
| GET    | `/v1/public/billing/plans/catalog?audience=professional` | Sin auth               |
| POST   | `/v1/public/billing/plan-lead-requests`                  | Sin auth               |
| POST   | `/v1/public/billing/checkout/subscription`               | Opcional JWT (cookies) |
| GET    | `/v1/billing/me`                                         | JWT usuario            |
| POST   | `/v1/billing/checkout/subscription`                      | JWT usuario (legacy)   |
| POST   | `/v1/billing/checkout/one-time`                          | JWT usuario            |
| POST   | `/v1/billing/portal`                                     | JWT usuario            |
| GET    | `/v1/billing/invoices`                                   | JWT usuario            |
| POST   | `/v1/billing/webhooks/stripe`                            | Firma Stripe           |
| CRUD   | `/v1/billing/plans`                                      | JWT + `billing.manage` |

## Dashboard admin

Tras login en el dashboard (`/subscription-plans`), crea/edita planes con precios, features, rol y botón **Sincronizar con Stripe**.

## Frontend

Visita `$FRONTEND_URL/monetizacion` para contratar plan, comprar add-ons y ver facturas.
