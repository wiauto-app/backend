import { PickType } from '@nestjs/mapped-types';
import { RegisterUserDto } from './register-user.dto';

export class UpdateEmailDto extends PickType(RegisterUserDto, ['email'] as const) {}