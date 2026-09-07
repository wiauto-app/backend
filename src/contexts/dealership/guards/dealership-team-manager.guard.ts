import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";

@Injectable()
export class DealershipTeamManagerGuard implements CanActivate {
  constructor(
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = getGuardRequest(context);
    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
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

    const member_role = membership.role;
    if (member_role !== "owner" && member_role !== "admin") {
      throw new ForbiddenException("No tienes permiso para gestionar el equipo");
    }

    return true;
  }
}
