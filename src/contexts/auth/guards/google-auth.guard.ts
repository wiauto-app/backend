import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import {
  applyOAuthPopupCookie,
  getOAuthPopupAuthenticateOptions,
} from "../utils/oauth-popup.guard-helper";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  canActivate(context: ExecutionContext) {
    applyOAuthPopupCookie(context);
    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return getOAuthPopupAuthenticateOptions(request);
  }
}
