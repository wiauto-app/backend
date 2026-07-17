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
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, user } = getGuardRequest(context);
    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const role = user.profile.role;
    if (!role) {
      throw new UnauthorizedException("Rol no encontrado");
    }

    if (role.is_admin || role.is_developer) {
      return true;
    }

    const dealership_id = request.params?.id as string | undefined;
    if (!dealership_id) {
      throw new ForbiddenException("Identificador de concesionario no válido");
    }

    const membership =
      await this.dealership_member_repository.findOneByDealershipIdAndProfileId(
        dealership_id,
        user.profile.id,
      );

    if (!membership) {
      throw new ForbiddenException("No perteneces a este concesionario");
    }

    const member_primitive = membership.toPrimitives();
    if (member_primitive.role !== "member") {
      throw new ForbiddenException(
        "Solo los miembros con rol member pueden salir del equipo por esta vía",
      );
    }

    request.dealership_member_id = member_primitive.id;
    return true;
  }
}
