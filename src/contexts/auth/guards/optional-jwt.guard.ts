import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable, isObservable } from "rxjs";
import { firstValueFrom } from "rxjs";

@Injectable()
export class OptionalJwtGuard extends AuthGuard("jwt") {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = super.canActivate(context);

      if (typeof result === "boolean") {
        return result;
      }

      if (isObservable(result)) {
        return await firstValueFrom(result);
      }

      return await result;
    } catch {
      return true;
    }
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser | null {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
