import { UnauthorizedException } from "@nestjs/common";

import { TwoFactorChallengeScopeGuard } from "@/contexts/auth/guards/two-factor-challenge-scope.guard";

describe("TwoFactorChallengeScopeGuard", () => {
  let guard: TwoFactorChallengeScopeGuard;

  const createContext = (authScope: string | undefined) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          auth_scope: authScope,
        }),
      }),
    }) as any;

  beforeEach(() => {
    guard = new TwoFactorChallengeScopeGuard();
  });

  it("should allow when auth_scope is 2fa_challenge", () => {
    const context = createContext("2fa_challenge");

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it("should throw when auth_scope is session", () => {
    const context = createContext("session");

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it("should throw when auth_scope is undefined", () => {
    const context = createContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
