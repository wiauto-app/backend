# API de leads WiAuto

Endpoint público para que formularios externos (partners) envíen leads a WiAuto.

## Endpoint


|              |                       |
| ------------ | --------------------- |
| Método       | `POST`                |
| URL          | `{BASE_URL}/v1/leads` |
| Auth         | No requiere           |
| Content-Type | `application/json`    |


Ejemplo de producción: `https://api.wiauto.es/v1/leads`  
*(Confirmar la* `BASE_URL` *con WiAuto.)*

> Llamar desde el **servidor** del partner. Desde el navegador puede fallar por CORS.

---

## Body

```json
{
  "type": "garantia",
  "first_name": "Ana García",
  "last_name": "opcional",
  "dni": "opcional",
  "phone": "612345678",
  "email": "ana@ejemplo.es",
  "extra_data": {
    "partner": "nombre-empresa",
    "source": "formulario-web",
    "observations": "texto libre"
  }
}
```


| Campo        | Obligatorio | Descripción                                            |
| ------------ | ----------- | ------------------------------------------------------ |
| `type`       | Sí          | Origen. Usar `seguros` o el valor acordado con WiAuto. |
| `first_name` | Sí          | Nombre o nombre completo.                              |
| `last_name`  | No          | Apellidos.                                             |
| `dni`        | No          | Documento.                                             |
| `phone`      | Sí          | Teléfono.                                              |
| `email`      | Sí          | Correo válido.                                         |
| `extra_data` | No          | Objeto JSON libre (partner, matrícula, etc.).          |


---



## Ejemplo curl

```bash
curl -X POST 'https://api.wiauto.es/v1/leads' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "seguros",
    "first_name": "Ana García",
    "phone": "612345678",
    "email": "ana@ejemplo.es",
    "extra_data": {
      "partner": "mi-empresa",
      "source": "formulario-web"
    }
  }'
```

---



## Respuesta OK

```json
{
  "ok": true,
  "status": 201,
  "data": {
    "id": "uuid",
    "type": "seguros",
    "status": "pending",
    "created_at": "2026-09-23T15:00:00.000Z"
  }
}
```



## Respuesta error

```json
{
  "ok": false,
  "status": 400,
  "message": "email must be an email",
  "data": null
}
```

---



## Notas

- Incluir siempre `extra_data.partner` con el nombre de la empresa.
- Con `type: "seguros"` o `"contacto"`, WiAuto recibe además un aviso por correo.
- No usar este endpoint para contactar al vendedor de un anuncio concreto.

