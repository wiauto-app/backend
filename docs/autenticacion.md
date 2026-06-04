# Autenticación — guía para frontend

Cómo conectar el front con el backend: **qué llamar**, **qué enviar** y **qué te devuelve**.  
Base URL: la del servidor API (hoy las rutas van en la raíz, sin `/api` extra).

**Token de sesión:** siempre mándalo así:

```http
Authorization: Bearer <tu_jwt>
```

---

## Flujo típico: cuenta con email + contraseña

1. **Registro** → `POST /users` con email y contraseña.
2. El usuario **recibe un correo** con un enlace (lo arma el backend apuntando al servidor API).
3. Ese enlace lleva al backend **`GET /auth/email-verification/confirm?token=...&redirectUrl=...`**: valida el token, marca el correo como verificado, **abre sesión** y **redirecciona** al front (`FRONTEND_REDIRECT_URL`, p. ej. `http://localhost:3000/api/auth/callback`) con `token`, `refresh_token`, `type` y opcionalmente `message`.
4. El callback del front guarda las cookies de sesión y redirige al home (o a 2FA si aplica). **No hace falta** un login manual después de verificar.
5. Si el enlace falla o expira, el backend redirige a **`/iniciar-sesion?error=...`** con el mensaje codificado.

---

## 1. Registro

**`POST /users`**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "mínimo 8 caracteres",
  "name": "Opcional",
  "last_name": "Opcional"
}
```

- Si el mail ya existe → error **409** con mensaje claro del backend.
- Si va bien → mensaje tipo “Te enviamos un correo…” + datos del usuario (sin contraseña).

Importante: hasta que no confirme el correo **no puede iniciar sesión** con email/contraseña.

---

## 2. Verificar el correo (desde el enlace del mail)

Un clic en el correo abre el backend (**GET**, no POST desde la SPA):

```text
GET /auth/email-verification/confirm?token=...&redirectUrl=...
```

- **`token`** — JWT de verificación (viene en el link del correo).
- **`redirectUrl`** — **obligatorio**; debe coincidir con una URL permitida (`FRONTEND_REDIRECT_URL` o `FRONTEND_URL`). El mail usa `FRONTEND_REDIRECT_URL` (ej. `http://localhost:3000/api/auth/callback`).

Flujo:

1. Backend valida el token, marca `is_email_verified` si aplica (si ya estaba verificado, igual inicia sesión) y crea sesión (JWT + refresh).
2. **302** al `redirectUrl` con `?token=&refresh_token=&type=session|2fa_challenge&message=...`.
3. Next.js `/api/auth/callback` guarda cookies httpOnly y redirige a `/?verified=1` (si hay `message`), `/` o `/2fa-challenge`.

Si el token es inválido o expiró: **302** a `{FRONTEND_URL}/iniciar-sesion?error=...`.

Variables de entorno (backend):

| Variable                | Ejemplo dev                               |
| ----------------------- | ----------------------------------------- |
| `FRONTEND_REDIRECT_URL` | `http://localhost:3000/api/auth/callback` |
| `BACKEND_URL`           | `http://localhost:4000`                   |
| `FRONTEND_URL`          | `http://localhost:3000`                   |

El enlace del correo se arma con `{BACKEND_URL}/auth/email-verification/confirm?token=...&redirectUrl=...`.

---

## 3. Reenviar correo de verificación

Sirve cuando el usuario **no puede iniciar sesión** porque aún no verificó el mail: no necesita JWT.

**`POST /auth/email-verification/resend`**

```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta (siempre la misma, aunque el correo no exista o ya esté verificado):** texto neutro tipo _“Si ese correo tiene una cuenta local pendiente de verificación, te enviamos un nuevo enlace.”_ Evita que alguien descubra qué mails están registrados. Solo cuenta **email + contraseña** pendiente de verificación recibe otro correo (Google/social no aplica).

---

## 4. Login con email y contraseña

**`POST /auth/login`**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "tu_contraseña"
}
```

**Errores frecuentes (401 u otros):**

- Email o contraseña mal.
- Ese email se registró con **Google** → el mensaje dirá que use ese proveedor.
- **No verificó el correo** → debe ir al mail o pedir reenvío.

**Si el login va bien, la respuesta es una de dos:**

**A) Sin 2FA — ya tenés sesión**

```json
{
  "type": "session",
  "token": "<JWT para guardar y usar en Bearer>",
  "refresh_token": "<refresh token en claro; guardar de forma segura si el cliente no usa cookies>"
}
```

El panel admin usa cookies HTTP (`access_token` y `refresh_token`); el valor de `refresh_token` en cookie es el token en claro (en base de datos solo se guarda su hash).

**B) Con 2FA — falta un segundo paso**

```json
{
  "type": "2fa_required",
  "challenge_token": "<JWT de corta duración>"
}
```

En **B**, completá el login con los endpoints del panel admin (cookies HTTP):

| Paso                       | Método | Ruta                               | Body                      |
| -------------------------- | ------ | ---------------------------------- | ------------------------- |
| Reanudar paso 2 (opcional) | GET    | `/auth/admin/two-factor/challenge` | — (cookie challenge)      |
| TOTP                       | POST   | `/auth/admin/verify-2fa`           | `{ "code": "123456" }`    |
| Código de respaldo         | POST   | `/auth/admin/verify-backup-code`   | `{ "code": "XXXX-XXXX" }` |

Tras verificar, la cookie `access_token` pasa a scope `session` y podés usar `GET /auth/me`.

**Alternativa (app móvil / sin cookies):** si el usuario tiene **códigos de respaldo**, podés llamar:

**`POST /2fa/validate-backup-code`** (sin Bearer)

```json
{
  "email": "usuario@ejemplo.com",
  "code": "código de respaldo"
}
```

Respuesta incluye un **`token`** de sesión listo para usar como Bearer. Cada código válido se **gasta** (ya no sirve de nuevo).

---

## 5. Quién soy (perfil con sesión)

**`GET /auth/me`**

```http
Authorization: Bearer <token de session>
```

Te devuelve usuario + perfil según cómo armó backend el `{ me }`.

---

## 6. Google

**Web**

- Abrís/redirigís a: `GET /auth/google`
- Google vuelve al backend y después el usuario llega al front en la URL configurada (**`FRONTEND_REDIRECT_URL`**) con: `?token=<JWT>`
- Leés el `token` de la query y lo guardás como sesión.

**App móvil**

**`POST /auth/google/mobile`**

```json
{
  "id_token": "<id_token que te da el SDK de Google>"
}
```

Respuesta:

```json
{
  "token": "<JWT de sesión>"
}
```

Usuarios de Google normalmente **no** pasan por verificación por correo ni por la pantalla de “reenviar mail”.  
Apple en este proyecto está desactivado en código.

---

## 7. Olvidé mi contraseña

**Pedir mail**

**`POST /auth/password-recovery/request`**

```json
{ "email": "usuario@ejemplo.com" }
```

Siempre muestra mensaje tipo “Si el correo existe, te llegarán instrucciones” (**no digas si el mail está o no registrado**: es a propósito).

**Cambiar contraseña**

El usuario abre el link del mail (lleva un `token`), tu pantalla manda:

**`POST /auth/password-recovery/change`**

```json
{
  "token": "<token del link>",
  "password": "nueva_contraseña"
}
```

---

## 8. Login del panel admin (cookies + 2FA)

**`POST /auth/admin/login`**

```json
{
  "email": "admin@ejemplo.com",
  "password": "tu_contraseña"
}
```

Respuesta (además de cookies `access_token` y `refresh_token`):

```json
{
  "message": "Login successful",
  "data": {
    "type": "session",
    "email": "admin@ejemplo.com"
  }
}
```

Si el usuario tiene 2FA activo, `data.type` es `"2fa_required"`. El JWT en cookie queda con scope `2fa_challenge` y **no** puede acceder a rutas protegidas (`GET /auth/me` devuelve 401) hasta completar:

1. **`GET /auth/admin/two-factor/challenge`** — reanudar el paso 2 si el usuario recarga `/signIn`.
2. **`POST /auth/admin/verify-2fa`** — `{ "code": "123456" }` (TOTP).
3. **`POST /auth/admin/verify-backup-code`** — `{ "code": "XXXX-XXXX" }` (código de respaldo, se consume).

Rutas permitidas con token `2fa_challenge`: verify-2fa, verify-backup-code, challenge, admin/logout.

**`POST /auth/admin/logout`** — cierra sesión y limpia cookies (válido en challenge o sesión completa).

---

## 9. 2FA (cuando el usuario ya está logueado)

Llevás **`Authorization: Bearer`** + JWT **de sesión** (el del login exitoso sin 2FA, o el mismo patrón que use el backend para rutas autenticadas).

| Paso                                                          | Petición                                        |
| ------------------------------------------------------------- | ----------------------------------------------- |
| Obtener QR y datos para la app del autenticador               | `GET /2fa/setup`                                |
| Activar tras escribir el código de 6 dígitos del autenticador | `POST /2fa/activate` con `{ "code": "123456" }` |

Otras rutas (`enable`, `disable`, `delete`, regenerar respaldos) siguen igual: Bearer + la que corresponda; detalle en colección Postman si la tenés.

---

## 9. Login admin (dashboard) con 2FA

El panel admin usa **cookies** (`access_token`, `refresh_token`), no Bearer en el body del login.

**Paso 1 — credenciales**

**`POST /auth/admin/login`**

```json
{
  "email": "admin@ejemplo.com",
  "password": "tu_contraseña"
}
```

Respuesta (dentro de `data` por el interceptor):

```json
{
  "message": "Login successful",
  "type": "session",
  "email": "admin@ejemplo.com"
}
```

Si el usuario tiene 2FA activo, `type` será **`2fa_required`**. Las cookies quedan con JWT en scope **`2fa_challenge`**; las rutas protegidas del panel devuelven **401** hasta completar el segundo factor.

**Paso 2a — TOTP (autenticador)**

**`POST /auth/admin/verify-2fa`** (cookie challenge)

```json
{ "code": "123456" }
```

Actualiza la cookie `access_token` con scope **`session`**.

**Paso 2b — código de respaldo**

**`POST /auth/admin/verify-backup-code`** (cookie challenge)

```json
{ "code": "ABCD-1234" }
```

**Reanudar pantalla de 2FA**

**`GET /auth/admin/two-factor/challenge`** (cookie challenge) → `{ "email", "type": "2fa_required" }`.

---

## Cheatsheet (una tabla)

| Acción                           | Método | Ruta                                                   |
| -------------------------------- | ------ | ------------------------------------------------------ |
| Registro                         | POST   | `/users`                                               |
| Confirmar correo (link del mail) | GET    | `/auth/email-verification/confirm?token=&redirectUrl=` |
| Reenviar correo                  | POST   | `/auth/email-verification/resend`                      |
| Login email                      | POST   | `/auth/login`                                          |
| Login admin (cookies)            | POST   | `/auth/admin/login`                                    |
| Verificar 2FA admin (TOTP)       | POST   | `/auth/admin/verify-2fa`                               |
| Verificar 2FA admin (backup)     | POST   | `/auth/admin/verify-backup-code`                       |
| Estado challenge 2FA admin       | GET    | `/auth/admin/two-factor/challenge`                     |
| Yo mismo                         | GET    | `/auth/me`                                             |
| Google web                       | GET    | `/auth/google` → vuelta con `?token=`                  |
| Google app                       | POST   | `/auth/google/mobile`                                  |
| Pedir reset contraseña           | POST   | `/auth/password-recovery/request`                      |
| Nueva contraseña                 | POST   | `/auth/password-recovery/change`                       |
| Código de respaldo → sesión      | POST   | `/2fa/validate-backup-code`                            |
| Login panel admin                | POST   | `/auth/admin/login`                                    |
| Completar 2FA admin (TOTP)       | POST   | `/auth/admin/verify-2fa`                               |
| Completar 2FA admin (respaldo)   | POST   | `/auth/admin/verify-backup-code`                       |
| Estado challenge admin           | GET    | `/auth/admin/two-factor/challenge`                     |
| Logout panel admin               | POST   | `/auth/admin/logout`                                   |

---

## Tips rápidos

- Guardá el JWT en el lugar que uses (memory, cookie httpOnly si lo arma el equipo, etc.) y renová cuando expire.
- El **token del mail de verificación** y el **token de reset de contraseña** no son el JWT de sesión: no los uses como `Bearer` para `/auth/me`.
- Si el backend agrega un prefijo global (`/api`), anteponelo a todas estas rutas.
