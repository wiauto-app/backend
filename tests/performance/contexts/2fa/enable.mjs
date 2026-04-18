import { check } from "k6";
import http from "k6/http";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  throw new Error("Falta AUTH_TOKEN (JWT de un usuario autenticado).");
}

export const options = {
  stages: [
    { duration: "5s", target: 10 },
    { duration: "10s", target: 100 },
    { duration: "5s", target: 0 },
  ],
  thresholds: {
    // Se esperan muchos 409 porque el primer hit habilita 2FA y los siguientes
    // reciben "2FA ya está habilitado". Solo vigilamos errores de red/5xx.
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<200"],
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/api/2fa/enable`,
    null,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } },
  );

  check(res, {
    "status 200 o 409": r => r.status === 200 || r.status === 409,
    "sin 5xx": r => r.status < 500,
  });
}
