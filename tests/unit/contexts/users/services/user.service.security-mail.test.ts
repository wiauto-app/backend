import { Repository } from "typeorm";

import { createMock, Mock } from "@/tests/utils/mock";
import { UserService } from "@/contexts/users/services/user.service";
import { UserAuthProviderService } from "@/contexts/users/services/user-auth-provider.service";
import { PasswordService } from "@/contexts/auth/services/password.service";
import { ProfileService } from "@/contexts/profiles/services/profile.service";
import { TypeOrmProfileRepository } from "@/contexts/profiles/repositories/typeorm.profile-repository";
import { EmailVerificationService } from "@/contexts/auth/services/email-verification.service";
import { AuthSecurityMailService } from "@/contexts/auth/services/auth-security-mail.service";
import { User } from "@/contexts/users/entities/user.entity";
import { VehicleEntity } from "@/contexts/vehicles/entities/vehicle.entity";

describe("UserService security mails (password_changed / account_deleted)", () => {
  let userService: UserService;
  let userRepository: Mock<Repository<User>>;
  let vehicleRepository: Mock<Repository<VehicleEntity>>;
  let passwordService: Mock<PasswordService>;
  let profileService: Mock<ProfileService>;
  let profileRepository: Mock<TypeOrmProfileRepository>;
  let userAuthProviderService: Mock<UserAuthProviderService>;
  let emailVerificationService: Mock<EmailVerificationService>;
  let authSecurityMailService: Mock<AuthSecurityMailService>;

  const userWithPassword = {
    id: "user-1",
    email: "user@example.com",
    password: "old-hash",
  } as User;

  beforeEach(() => {
    userRepository = createMock<Repository<User>>();
    vehicleRepository = createMock<Repository<VehicleEntity>>();
    passwordService = createMock<PasswordService>();
    profileService = createMock<ProfileService>();
    profileRepository = createMock<TypeOrmProfileRepository>();
    userAuthProviderService = createMock<UserAuthProviderService>();
    emailVerificationService = createMock<EmailVerificationService>();
    authSecurityMailService = createMock<AuthSecurityMailService>();

    userService = new UserService(
      userRepository,
      vehicleRepository,
      passwordService,
      profileService,
      profileRepository,
      userAuthProviderService,
      emailVerificationService,
      authSecurityMailService,
    );
  });

  it("enqueues password_changed after updatePassword", async () => {
    const qb = {
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(userWithPassword),
    };
    userRepository.createQueryBuilder.mockReturnValue(qb as any);
    passwordService.comparePassword.mockResolvedValue(true);
    passwordService.hashPassword.mockResolvedValue("new-hash");
    userRepository.preload.mockResolvedValue({
      ...userWithPassword,
      password: "new-hash",
    } as User);
    userRepository.save.mockResolvedValue({
      ...userWithPassword,
      password: "new-hash",
    } as User);

    await userService.updatePassword(
      {
        current_password: "old",
        password: "new-password",
      } as any,
      userWithPassword.id,
    );

    expect(authSecurityMailService.enqueuePasswordChanged).toHaveBeenCalledWith({
      to: userWithPassword.email,
    });
  });

  it("enqueues password_changed after resetPassword", async () => {
    const qb = {
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(userWithPassword),
    };
    userRepository.createQueryBuilder.mockReturnValue(qb as any);
    passwordService.hashPassword.mockResolvedValue("reset-hash");
    userRepository.preload.mockResolvedValue({
      ...userWithPassword,
      password: "reset-hash",
    } as User);
    userRepository.save.mockResolvedValue({
      ...userWithPassword,
      password: "reset-hash",
    } as User);

    await userService.resetPassword(userWithPassword.id, "nueva");

    expect(authSecurityMailService.enqueuePasswordChanged).toHaveBeenCalledWith({
      to: userWithPassword.email,
    });
  });

  it("enqueues account_deleted after remove with email captured before delete", async () => {
    userRepository.findOne.mockResolvedValue(userWithPassword);
    vehicleRepository.count.mockResolvedValue(0);
    userRepository.delete.mockResolvedValue({ affected: 1 } as any);

    await userService.remove(userWithPassword.id);

    expect(userRepository.delete).toHaveBeenCalledWith(userWithPassword.id);
    expect(authSecurityMailService.enqueueAccountDeleted).toHaveBeenCalledWith({
      to: userWithPassword.email,
    });
  });
});
