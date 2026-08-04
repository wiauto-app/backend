import { Repository } from "typeorm";

import { createMock, Mock } from "@/tests/utils/mock";
import { AdminUserService } from "@/contexts/users/services/admin-user.service";
import { AuthSecurityMailService } from "@/contexts/auth/services/auth-security-mail.service";
import { PasswordService } from "@/contexts/auth/services/password.service";
import { User } from "@/contexts/users/entities/user.entity";

describe("AdminUserService.delete (account_deleted)", () => {
  let service: AdminUserService;
  let userRepository: Mock<Repository<User>>;
  let passwordService: Mock<PasswordService>;
  let authSecurityMailService: Mock<AuthSecurityMailService>;

  beforeEach(() => {
    userRepository = createMock<Repository<User>>();
    passwordService = createMock<PasswordService>();
    authSecurityMailService = createMock<AuthSecurityMailService>();

    service = new AdminUserService(
      userRepository,
      passwordService,
      authSecurityMailService,
    );
  });

  it("captures email before delete and enqueues account_deleted", async () => {
    userRepository.findOne.mockResolvedValue({
      id: "user-1",
      email: "borrar@example.com",
    } as User);
    userRepository.delete.mockResolvedValue({ affected: 1 } as any);

    await service.delete("user-1");

    expect(userRepository.delete).toHaveBeenCalledWith("user-1");
    expect(authSecurityMailService.enqueueAccountDeleted).toHaveBeenCalledWith({
      to: "borrar@example.com",
    });
  });
});
