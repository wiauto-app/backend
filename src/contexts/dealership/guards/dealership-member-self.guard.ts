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
export class DealershipMemberSelfGuard implements CanActivate {
  constructor(
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, user } = getGuardRequest(context);
    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    if (user.is_admin) {
      return true;
    }

    const membership =
      await this.dealership_member_repository.findOneByProfileId(
        user.profile.id,
      );

    if (!membership) {
      throw new ForbiddenException("No perteneces a este concesionario");
    }

    if (membership.role !== "member") {
      throw new ForbiddenException(
        "Solo los miembros con rol member pueden salir del equipo por esta vía",
      );
    }

    request.dealership_member_id = membership.id;
    return true;
  }
}
