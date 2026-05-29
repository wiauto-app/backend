import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import type { Socket } from "socket.io";

const parse_cookie_header = (cookie_header: string | undefined): Record<string, string> => {
  if (!cookie_header) return {};
  const cookies: Record<string, string> = {};
  for (const part of cookie_header.split(";")) {
    const [raw_key, ...raw_value] = part.trim().split("=");
    const key = raw_key.trim();
    if (!key) continue;
    cookies[key] = decodeURIComponent(raw_value.join("="));
  }
  return cookies;
};

const strip_bearer_prefix = (token: string): string =>
  token.startsWith("Bearer ") ? token.slice(7) : token;

type SocketRequest = Request & {
  cookies: Record<string, string | undefined>;
};

@Injectable()
export class WsJwtGuard extends AuthGuard("jwt") {
  getRequest(context: ExecutionContext): SocketRequest {
    const client = context.switchToWs().getClient<Socket>();
    const request = client.request as SocketRequest;
    const cookies = parse_cookie_header(client.handshake.headers.cookie);
    const auth_token_raw =
      typeof client.handshake.auth.token === "string" ? client.handshake.auth.token : undefined;

    const token_from_auth = auth_token_raw ? strip_bearer_prefix(auth_token_raw) : undefined;
    const token_from_cookie = cookies.access_token;
    const token = token_from_auth ?? token_from_cookie;
    if (token) {

      request.headers.authorization = `Bearer ${token}`;
    }

    request.cookies = {
      ...request.cookies,
      access_token: token_from_cookie,
    };

    return request;
  }
}
