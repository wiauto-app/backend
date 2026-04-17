import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateEmailDto extends PickType(CreateUserDto, ['email'] as const) {}