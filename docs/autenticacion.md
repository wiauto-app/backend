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
2. El usuario **recibe un correo** con un enlace (lo arma el backend).
3. Ese enlace lleva al backend **`GET .../confirm?...`**; el servidor marca el correo como verificado y **redirecciona** por ahora al localhost:3000.
4. **Login** → `POST /auth/login`. Si todo va bien, guardás el JWT y ya podés llamar rutas protegidas (ej. `GET /auth/me`) ubicando el token de autenticacion en la peticion como authotization bearer token.

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

El usuario hace clic y el navegador pega contra el backend (**no es un POST desde tu SPA**, es una URL tipo):

```text
GET /auth/email-verification/confirm?token=...&redirectUrl=...
```

- **`token`** — viene en el link del correo.
- **`redirectUrl`** — **obligatorio**: a dónde quieres llevar al usuario después (ej. página de login o “correo verificado”). Convén con backend una lista de URLs permitidas si te importa seguridad (**open redirect**).

Respuesta esperada: **redirección 302** al `redirectUrl` si todo salió bien.

Tu front puede tener una página “processing” pero lo normal es que el mail apunte ya con `redirectUrl` armado por vos.

---

## 3. Reenviar correo de verificación

Sirve cuando el usuario **no puede iniciar sesión** porque aún no verificó el mail: no necesita JWT.

**`POST /auth/email-verification/resend`**

```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta (siempre la misma, aunque el correo no exista o ya esté verificado):** texto neutro tipo *“Si ese correo tiene una cuenta local pendiente de verificación, te enviamos un nuevo enlace.”* Evita que alguien descubra qué mails están registrados. Solo cuenta **email + contraseña** pendiente de verificación recibe otro correo (Google/social no aplica).

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
  "token": "<JWT para guardar y usar en Bearer>"
}
```

**B) Con 2FA — falta un segundo paso**

```json
{
  "type": "2fa_required",
  "challenge_token": "<JWT de corta duración>"
}
```

En **B**, hoy el backend no expone un endpoint documentado del estilo “código del autenticador + `challenge_token` → devuelve `session`”. Coordiná con backend si tenés que completar login solo con TOTP.  
**Alternativa que sí existe:** si el usuario tiene **códigos de respaldo**, podés llamar:

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

## 8. 2FA (cuando el usuario ya está logueado)

Llevás **`Authorization: Bearer`** + JWT **de sesión** (el del login exitoso sin 2FA, o el mismo patrón que use el backend para rutas autenticadas).

| Paso | Petición |
|------|----------|
| Obtener QR y datos para la app del autenticador | `GET /2fa/setup` |
| Activar tras escribir el código de 6 dígitos del autenticador | `POST /2fa/activate` con `{ "code": "123456" }` |

Otras rutas (`enable`, `disable`, `delete`, regenerar respaldos) siguen igual: Bearer + la que corresponda; detalle en colección Postman si la tenés.

---

## Cheatsheet (una tabla)

| Acción | Método | Ruta |
|--------|--------|------|
| Registro | POST | `/users` |
| Confirmar correo (link del mail) | GET | `/auth/email-verification/confirm?token=&redirectUrl=` |
| Reenviar correo | POST | `/auth/email-verification/resend` |
| Login email | POST | `/auth/login` |
| Yo mismo | GET | `/auth/me` |
| Google web | GET | `/auth/google` → vuelta con `?token=` |
| Google app | POST | `/auth/google/mobile` |
| Pedir reset contraseña | POST | `/auth/password-recovery/request` |
| Nueva contraseña | POST | `/auth/password-recovery/change` |
| Código de respaldo → sesión | POST | `/2fa/validate-backup-code` |

---

## Tips rápidos

- Guardá el JWT en el lugar que uses (memory, cookie httpOnly si lo arma el equipo, etc.) y renová cuando expire.
- El **token del mail de verificación** y el **token de reset de contraseña** no son el JWT de sesión: no los uses como `Bearer` para `/auth/me`.
- Si el backend agrega un prefijo global (`/api`), anteponelo a todas estas rutas.
