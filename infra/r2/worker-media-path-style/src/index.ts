/**
 * CDN: https://media.wiauto.es/{*objectKey}
 * Un solo bucket R2; la key incluye el directorio lógico
 * (vehicles-images/..., vehicles-videos/..., etc.).
 *
 * Las escrituras/presign NO pasan por este Worker; van al API S3 de cuenta R2.
 *
 * Nota: si el custom domain de R2 apunta al bucket, este Worker puede
 * omitirse; se mantiene como proxy opcional.
 */

interface Env {
  MEDIA: R2Bucket;
}

const guessContentType = (key: string): string => {
  const lower = key.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const objectKey = url.pathname.replace(/^\/+/, "");
    if (!objectKey || objectKey.includes("..")) {
      return new Response("Not Found", { status: 404 });
    }

    const object = await env.MEDIA.get(objectKey);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    if (!headers.has("content-type")) {
      headers.set("content-type", guessContentType(objectKey));
    }
    headers.set("cache-control", "public, max-age=31536000, immutable");

    if (request.method === "HEAD") {
      return new Response(null, { headers });
    }

    return new Response(object.body, { headers });
  },
};
