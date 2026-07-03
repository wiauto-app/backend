import { UnauthorizedException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { RegisterService } from "@/contexts/auth/services/register.service";
import { UserService } from "@/contexts/users/services/user.service";
import { RolesService } from "@/contexts/roles/services/roles.service";
import { RegisterDto } from "@/contexts/auth/dto/register.dto";

describe("RegisterService", () => {
  let registerService: RegisterService;
  let userService: Mock<UserService>;
  let rolesService: Mock<RolesService>;

  beforeEach(() => {
    userService = createMock<UserService>();
    rolesService = createMock<RolesService>();
    registerService = new RegisterService(userService, rolesService);
  });

  describe("register", () => {
    const registerDto: RegisterDto = {
      email: "test@example.com",
      password: "password123",
      name: "John",
      last_name: "Doe",
    };

    const defaultRole = { id: "role-1", name: "user", is_default: true };

    it("should register a user with default role", async () => {
      rolesService.findDefault.mockResolvedValue(defaultRole as any);
      userService.create.mockResolvedValue({ message: "User created", data: { id: "user-1" } } as any);

      const result = await registerService.register(registerDto);

      expect(result).toEqual({ message: "User created", data: { id: "user-1" } });
      expect(rolesService.findDefault).toHaveBeenCalled();
      expect(userService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        last_name: registerDto.last_name,
        role_id: defaultRole.id,
      });
    });

    it("should throw UnauthorizedException when no default role exists", async () => {
      rolesService.findDefault.mockResolvedValue(null);

      await expect(registerService.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it("should propagate error when userService.create throws", async () => {
      rolesService.findDefault.mockResolvedValue(defaultRole as any);
      const conflictError = new Error("Ya existe un usuario registrado con ese email");
      userService.create.mockRejectedValue(conflictError);

      await expect(registerService.register(registerDto)).rejects.toThrow(
        "Ya existe un usuario registrado con ese email",
      );
      expect(rolesService.findDefault).toHaveBeenCalled();
      expect(userService.create).toHaveBeenCalled();
    });
  });
});
