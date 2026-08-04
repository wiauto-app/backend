# Inventario de correos WiAuto

Estado al **2026-08-04**, según código en `wiauto-backend` (`mail-template.renderer`, cola `outbound-mail`, servicios que encolan). Actualizado tras correos de bienvenida y seguridad (auth).

**Leyenda**

- `[x]` Listo: plantilla + envío cableado de punta a punta
- `[ ]` Pendiente: no existe o solo hay piezas sueltas

---

## Concesionarios

- [ ] Captación de concesionarios (Manual)
- [ ] Gracias por solicitar información (Automático) — hoy el lead de planes notifica al **staff**, no un “gracias” al solicitante
- [ ] Reserva de una demostración (Manual)
- [x] Bienvenida a Wiauto PRO (Automático) — `subscription_welcome`
- [ ] Primeros pasos (Automático)
- [ ] Seguimiento (7 días) (Automático)
- [ ] Renovación (Automático) — hay `subscription_cancel_scheduled` / `subscription_ended`, no un mail de renovación
- [ ] Novedades y funcionalidades (Automático)

---

## Particulares

- [x] Bienvenida (Automático) — `user_welcome` (verificación email primera vez + OAuth nuevo)
- [x] Verificación del correo (Automático) — `sendEmailVerification`
- [x] Vehículo publicado (Automático) — al crear anuncio
- [x] Vehículo aprobado (Automático) — status → `active`
- [x] Vehículo rechazado (Automático) — `inactive` con motivo
- [x] Has recibido un interesado (Automático) — `lead_notification`
- [x] Nuevo mensaje (Automático) — plantilla dedicada + CTA `/mensajes?chat_id=`
- [x] Vehículo vendido (Automático) — status → `sold`
- [ ] Destaca tu anuncio (Automático)
- [x] Anuncio próximo a caducar (Automático) — cola `vehicle-listing-expiry` (−3 días)
- [x] Anuncio caducado (Automático) — expire + `inactive` sin motivo de rechazo
- [ ] Gracias por confiar en Wiauto (Automático)

---

## Newsletter

- [ ] Bienvenida (Automático)
- [ ] Lanzamiento oficial (Manual)
- [ ] Novedades (Manual)
- [ ] Consejos para comprar y vender (Manual)
- [ ] Promociones (Manual)
- [ ] Reactivación de usuarios (Automático)

---

## Wiauto PRO Premium

- [x] Pago recibido (Automático) — `subscription_payment_received` (asunto “Pago recibido”)
- [x] Factura disponible (Automático) — mismo correo incluye CTA/enlace `hosted_invoice_url` / PDF
- [x] Renovación (Automático) — mismo job con asunto/copy de renovación si `billing_reason=subscription_cycle`
- [x] Cambio de plan (Automático) — `subscription_plan_changed` en `customer.subscription.updated`
- [x] Límite de anuncios (Automático) — `listing_limit_reached` (throttle 1/día por perfil)
- [x] Compra de destacados (Automático) — `featured_purchased` tras one-time `feature_vehicle`
- [x] Vencimiento de destacados (Automático) — `featured_expired` desde `expireFeatured()`

---

## Seguridad

- [x] Confirmación de registro (Automático) — mismo flujo que verificación de correo
- [x] Recuperación de contraseña (Automático) — `password_recovery`
- [x] Cambio de contraseña (Automático) — `password_changed` (`updatePassword` / `resetPassword`)
- [ ] Cambio de correo (Automático)
- [x] Nuevo inicio de sesión (Automático) — `new_login` (plataforma, admin y tras 2FA)
- [x] Eliminación de cuenta (Automático) — `account_deleted` (`UserService.remove` / `AdminUserService.delete`)

---

## Resumen

| Métrica                     | Cantidad |
| --------------------------- | -------- |
| Total de correos (catálogo) | 39       |
| Automáticos (catálogo)      | 33       |
| Manuales (catálogo)         | 6        |
| **Listos (`[x]`)**          | **24**   |
| **Pendientes (`[ ]`)**      | **15**   |

### También cableados (fuera del catálogo / apoyo)

- Desactivado / archivado (temas de estado)
- Invitación a concesionaria / equipo unido
- Lead de planes → staff
- Checkout abandonado / pago fallido
- Alertas de comprador (match, evento, digest)
- Solicitud de tasación (nueva / respondida)

---

## Checklist de prueba rápida (particulares mockup)

1. Crear anuncio → Publicado
2. Admin → `active` → Aprobado
3. Admin → `inactive` + mensaje → Rechazado
4. Lead → Interesado
5. Chat comprador → Nuevo mensaje
6. Job −3 días → Próximo a caducar
7. Job expire / renew → Caducado y `expires_at` alargado al renovar

## Checklist de prueba rápida (PRO Premium)

1. `invoice.paid` primer cobro → mail “Pago recibido” con factura
2. `invoice.paid` `subscription_cycle` → mail “Renovación confirmada”
3. Cambio de `plan_id` en suscripción → mail “Cambio de plan”
4. Crear anuncio al cupo → 403 + mail límite (máx. 1/día)
5. Compra one-time destacar → mail destacado activo
6. `expireFeatured` → mail destacado finalizado
