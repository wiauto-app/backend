import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Socket } from "socket.io";

interface WsRequestLike {
  headers: { authorization?: string; cookie?: string };
  cookies: Record<string, string | undefined>;
}

const parse_cookie_header = (cookie_header: string | undefined): Record<string, string> => {
  if (!cookie_header) return {};
  return cookie_header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [raw_key, ...raw_value] = part.trim().split("=");
    const key = raw_key.trim();
    if (!key) return acc;
    acc[key] = decodeURIComponent(raw_value.join("="));
    return acc;
  }, {});
};

@Injectable()
export class WsJwtGuard extends AuthGuard("jwt") {
  getRequest(context: ExecutionContext): WsRequestLike {
    const client = context.switchToWs().getClient<Socket>();
    const auth_token = client.handshake.auth.token as string | undefined;
    const cookie_header = client.handshake.headers.cookie;
    const cookies = parse_cookie_header(cookie_header);

    const authorization = auth_token
      ? (auth_token.startsWith("Bearer ")
        ? auth_token
        : `Bearer ${auth_token}`)
      : undefined;

    return {
      headers: {
        authorization,
        cookie: cookie_header,
      },
      cookies: {
        access_token: cookies.access_token,
      },
    };
  }
}

