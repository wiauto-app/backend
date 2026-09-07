import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";

import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";

@Injectable()
export class DealershipMemberGuard implements CanActivate {
  constructor(
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = getGuardRequest(context);
    if (!user?.profile) {
      throw new ForbiddenException("Usuario no autenticado");
    }

    if (user.is_admin) {
      return true;
    }


    const membership =
      await this.dealership_member_repository.findOneByProfileId(
        user.id,
      );

    if (!membership) {
      throw new ForbiddenException("No perteneces a este concesionario");
    }

    return true;
  }
}
