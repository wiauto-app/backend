import { createMock, Mock } from "@/tests/utils/mock";
import { RefreshTokenGuard } from "@/contexts/auth/guards/refresh-token.guard";
import { RefreshTokenService } from "@/contexts/auth/services/refresh-token.service";

describe("RefreshTokenGuard", () => {
  let refreshTokenGuard: RefreshTokenGuard;
  let refreshTokenService: Mock<RefreshTokenService>;

  const createContext = (cookies: Record<string, string>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          cookies,
        }),
      }),
    }) as any;

  beforeEach(() => {
    refreshTokenService = createMock<RefreshTokenService>();
    refreshTokenGuard = new RefreshTokenGuard(refreshTokenService);
  });

  it("should allow when refresh_token cookie is present", () => {
    const context = createContext({ refresh_token: "some-token" });

    const result = refreshTokenGuard.canActivate(context);

    expect(result).toBe(true);
  });

  it("should deny when refresh_token cookie is missing", () => {
    const context = createContext({});

    const result = refreshTokenGuard.canActivate(context);

    expect(result).toBe(false);
  });

  it("should deny when refresh_token cookie is empty", () => {
    const context = createContext({ refresh_token: "" });

    const result = refreshTokenGuard.canActivate(context);

    expect(result).toBe(false);
  });
});
