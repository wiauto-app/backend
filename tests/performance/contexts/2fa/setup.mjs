import { check } from "k6";
import http from "k6/http";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  throw new Error("Falta AUTH_TOKEN (JWT de un usuario autenticado).");
}

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "20s", target: 50 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/2fa/setup`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });

  check(res, {
    "status 200": r => r.status === 200,
    "devuelve otpauth_url": r => !!r.json("otpauth_url"),
    "devuelve qr_code_data_url": r =>
      typeof r.json("qr_code_data_url") === "string" &&
      r.json("qr_code_data_url").startsWith("data:image/png;base64,"),
  });
}
