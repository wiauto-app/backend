import { check } from "k6";
import http from "k6/http";
import { generateTotp } from "./helpers/totp.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN;
const TOTP_SECRET = __ENV.TOTP_SECRET;

if (!AUTH_TOKEN) throw new Error("Falta AUTH_TOKEN");
if (!TOTP_SECRET) throw new Error("Falta TOTP_SECRET");

export const options = {
  stages: [
    { duration: "10s", target: 5 },
    { duration: "20s", target: 20 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<400"],
  },
};

export default function () {
  const code = generateTotp(TOTP_SECRET);

  const res = http.post(
    `${BASE_URL}/api/2fa/disable`,
    JSON.stringify({ code }),
    {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );

  check(res, {
    "status 200 o 400": r => r.status === 200 || r.status === 400,
    "sin 5xx": r => r.status < 500,
  });
}
