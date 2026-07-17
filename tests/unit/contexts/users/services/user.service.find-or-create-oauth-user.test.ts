import { UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";

import { createMock, Mock } from "@/tests/utils/mock";
import { UserService } from "@/contexts/users/services/user.service";
import { UserAuthProviderService } from "@/contexts/users/services/user-auth-provider.service";
import { PasswordService } from "@/contexts/auth/services/password.service";
import { ProfileService } from "@/contexts/profiles/services/profile.service";
import { TypeOrmProfileRepository } from "@/contexts/profiles/repositories/typeorm.profile-repository";
import { EmailVerificationService } from "@/contexts/auth/services/email-verification.service";
import { User } from "@/contexts/users/entities/user.entity";
import { VehicleEntity } from "@/contexts/vehicles/entities/vehicle.entity";
import { authResponseConfig } from "@/contexts/auth/response.config";

describe("UserService.findOrCreateOAuthUser (multiprovider)", () => {
  let userService: UserService;
  let userRepository: Mock<Repository<User>>;
  let vehicleRepository: Mock<Repository<VehicleEntity>>;
  let passwordService: Mock<PasswordService>;
  let profileService: Mock<ProfileService>;
  let profileRepository: Mock<TypeOrmProfileRepository>;
  let userAuthProviderService: Mock<UserAuthProviderService>;
  let emailVerificationService: Mock<EmailVerificationService>;

  const localUser = {
    id: "user-1",
    email: "user@example.com",
    password: "hashed-local-password",
    is_email_verified: true,
    auth_providers: [],
  } as User;

  beforeEach(() => {
    userRepository = createMock<Repository<User>>();
    vehicleRepository = createMock<Repository<VehicleEntity>>();
    passwordService = createMock<PasswordService>();
    profileService = createMock<ProfileService>();
    profileRepository = createMock<TypeOrmProfileRepository>();
    userAuthProviderService = createMock<UserAuthProviderService>();
    emailVerificationService = createMock<EmailVerificationService>();

    userService = new UserService(
      userRepository,
      vehicleRepository,
      passwordService,
      profileService,
      profileRepository,
      userAuthProviderService,
      emailVerificationService,
    );
  });

  it("links Google to a local user without clearing password", async () => {
    userAuthProviderService.findByProvider.mockResolvedValue(null);
    userRepository.findOne.mockResolvedValue(localUser);
    userAuthProviderService.linkProvider.mockResolvedValue({
      id: "identity-1",
      user_id: localUser.id,
      provider: "google",
      provider_id: "google-123",
    } as any);

    const result = await userService.findOrCreateOAuthUser({
      provider: "google",
      provider_id: "google-123",
      email: localUser.email,
      first_name: "Ada",
      last_name: "Lovelace",
      role_id: "role-1",
    });

    expect(result.id).toBe(localUser.id);
    expect(result.password).toBe("hashed-local-password");
    expect(userAuthProviderService.linkProvider).toHaveBeenCalledWith(
      localUser.id,
      "google",
      "google-123",
    );
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(profileService.createProfile).not.toHaveBeenCalled();
  });

  it("adds Apple as a second OAuth identity on the same email", async () => {
    const userWithGoogle = {
      ...localUser,
      auth_providers: [
        {
          id: "identity-google",
          user_id: localUser.id,
          provider: "google",
          provider_id: "google-123",
        },
      ],
    } as User;

    userAuthProviderService.findByProvider.mockResolvedValue(null);
    userRepository.findOne.mockResolvedValue(userWithGoogle);
    userAuthProviderService.linkProvider.mockResolvedValue({
      id: "identity-apple",
      user_id: localUser.id,
      provider: "apple",
      provider_id: "apple-456",
    } as any);

    const result = await userService.findOrCreateOAuthUser({
      provider: "apple",
      provider_id: "apple-456",
      email: localUser.email,
      first_name: "Ada",
      last_name: "Lovelace",
      role_id: "role-1",
    });

    expect(result.id).toBe(localUser.id);
    expect(result.password).toBe("hashed-local-password");
    expect(userAuthProviderService.linkProvider).toHaveBeenCalledWith(
      localUser.id,
      "apple",
      "apple-456",
    );
    expect(userAuthProviderService.findByProvider).toHaveBeenCalledWith(
      "apple",
      "apple-456",
    );
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("returns existing user when OAuth identity is already linked", async () => {
    userAuthProviderService.findByProvider.mockResolvedValue(localUser);

    const result = await userService.findOrCreateOAuthUser({
      provider: "google",
      provider_id: "google-123",
      email: localUser.email,
      first_name: "Ada",
      role_id: "role-1",
    });

    expect(result).toBe(localUser);
    expect(userRepository.findOne).not.toHaveBeenCalled();
    expect(userAuthProviderService.linkProvider).not.toHaveBeenCalled();
  });

  it("throws when OAuth profile has no email and identity is unknown", async () => {
    userAuthProviderService.findByProvider.mockResolvedValue(null);

    await expect(
      userService.findOrCreateOAuthUser({
        provider: "apple",
        provider_id: "apple-789",
        email: null,
        first_name: "Ada",
        role_id: "role-1",
      }),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      userService.findOrCreateOAuthUser({
        provider: "apple",
        provider_id: "apple-789",
        email: "   ",
        first_name: "Ada",
        role_id: "role-1",
      }),
    ).rejects.toThrow(authResponseConfig.messages.OAUTH_EMAIL_REQUIRED);
  });
});
