import { Injectable } from "../../shared/dependency-injectable/injectable";
import { AdminCreateUserDto } from "../dto/admin/create-user.dto";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { PasswordService } from "../../auth/services/password.service";
import { AdminUpdateUserDto } from "../dto/admin/update-user.dto";

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) { }

  async create(createUserDto: AdminCreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: createUserDto.email
      }
    })

    if (existingUser) {
      throw new ConflictException("Ya existe un usuario registrado con ese email")
    }

    const hashedPassword = await this.passwordService.hashPassword(createUserDto.password)

    const createdUser = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      is_email_verified: true,
      provider: "local",
    })
    const user = await this.userRepository.save(createdUser)
    return user
  }

  async update(updateUserDto: AdminUpdateUserDto): Promise<User> {
    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      hashedPassword = await this.passwordService.hashPassword(updateUserDto.password)
    }
    const existingUser = await this.userRepository.findOne({
      where: { id: updateUserDto.id }
    })
    if (!existingUser) {
      throw new NotFoundException("Usuario no encontrado")
    }


    const user = await this.userRepository.preload({
      ...updateUserDto,
      password: hashedPassword ?? undefined,
    })
    if (!user) {
      throw new NotFoundException("Usuario no encontrado")
    }
    await this.userRepository.save(user)
    user.password = null;
    return user
  }

  async delete(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id }
    })
    if (!user) {
      throw new NotFoundException("Usuario no encontrado")
    }
    await this.userRepository.softDelete(id)
  }
}