# Cloudflare R2 (un solo bucket) + `media.wiauto.es`

Checklist operativo MinIO → R2. **No guardar secretos en este repo.**

## Modelo

- **1 bucket físico** R2 (`R2_BUCKET_NAME`, p. ej. `wiauto-media`).
- **Directorios lógicos** en código (`STORAGE_DIRECTORIES` en `src/contexts/shared/file/storage-directories.ts`):
  - `vehicles-images`
  - `vehicles-videos`
  - `dealership-images`
  - `profile-images`
  - `chat-attachments`
  - `files`
- Object key = `{directory}/{resto}` (p. ej. `vehicles-images/temp/vehicle-gallery/uuid.webp`).
- URL pública = `{R2_PUBLIC_URL}/{directory}/{resto}`.
- El campo HTTP `bucket_name` del API sigue siendo el **directorio lógico** (compatibilidad con front).

## Variables Nest

| Variable                                    | Ejemplo                                         |
| ------------------------------------------- | ----------------------------------------------- |
| `R2_S3_ENDPOINT`                            | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL`                             | `https://media.wiauto.es`                       |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Token API R2                                    |
| `R2_BUCKET_NAME`                            | `wiauto-media`                                  |

Escrituras/presign → `R2_S3_ENDPOINT` + `R2_BUCKET_NAME`.  
Lecturas CDN → `R2_PUBLIC_URL` (custom domain del bucket o Worker).

## Token API

1. Cloudflare Dashboard → R2 → Manage R2 API Tokens.
2. Object Read & Write sobre el bucket único.
3. Copiar Access Key ID + Secret a `.env` (no a git).

## CORS (en el bucket único)

Orígenes: Next, Dashboard, localhost.  
Métodos: `GET`, `PUT`, `HEAD`, `DELETE`.  
Headers permitidos: `*` (las partes multipart firmadas pueden llevar cabeceras de checksum).  
Headers expuestos: `ETag` — **obligatorio** para la subida multipart de vídeos: el navegador
lee el `ETag` de cada parte y lo envía a `POST /v1/vehicle-videos/uploads/:id/complete`.

```json
[
  {
    "AllowedOrigins": [
      "https://wiauto.es",
      "https://www.wiauto.es",
      "https://<dashboard>",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

La app móvil no necesita CORS (no es un navegador).

## Vídeos de vehículos

- Subida: multipart directo a R2 (`/v1/vehicle-videos/uploads`), partes de 10 MiB, máx. 300 MB / 120 s.
- Temporal: `vehicles-videos/temp/{profileId}/{uploadId}/original.{ext}`.
- Definitivo: `vehicles-videos/{vehicleId}/{videoId}/original.{ext}` + `optimized.mp4` + `thumbnail.webp`.
- El worker (`APP_ROLE=worker`, `node dist/worker.js`) necesita `ffmpeg`/`ffprobe` con `libx264`, `libwebp` y `zscale` (zimg) para el tone mapping HDR.
- R2 aborta multipart incompletos a los 7 días; además la limpieza horaria los aborta a las 6 h.

## Custom domain

Opción A (recomendada): custom domain R2 del bucket → `media.wiauto.es` (sirve keys tal cual).  
Opción B: Worker en `worker-media-path-style/` con binding `MEDIA`.

Smoke: `GET https://media.wiauto.es/vehicles-images/<key-existente>`.

## Sync MinIO → R2 (un bucket)

Cada bucket MinIO antiguo se copia como **prefijo** en el bucket único:

```bash
rclone sync minio:vehicles-images r2:wiauto-media/vehicles-images --checksum --progress
rclone sync minio:vehicles-videos r2:wiauto-media/vehicles-videos --checksum --progress
rclone sync minio:dealership-images r2:wiauto-media/dealership-images --checksum --progress
rclone sync minio:profile-images r2:wiauto-media/profile-images --checksum --progress
rclone sync minio:chat-attachments r2:wiauto-media/chat-attachments --checksum --progress
rclone sync minio:files r2:wiauto-media/files --checksum --progress
```

## Cutover

1. Sync final.
2. Deploy envs Nest + custom domain/Worker.
3. Smoke: temp image, signed PUT, vídeo, delete, promote, mail.
4. Apagar MinIO cuando no queden lecturas.
