import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";

/**
 * Solo el propietario del concesionario indicado en `:id` (o un admin de la
 * plataforma) puede continuar. A diferencia de `DealershipTeamManagerGuard`,
 * compara contra el concesionario de la ruta y no contra "cualquier" membresía
 * del usuario.
 */
@Injectable()
export class DealershipOwnerGuard implements CanActivate {
  constructor(
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, user } = getGuardRequest(context);
    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    if (user.is_admin) {
      return true;
    }

    const dealership_id = request.params.id;
    const owner =
      await this.dealership_member_repository.findOwnerMemberByDealershipId(
        dealership_id,
        "owner",
      );

    if (!owner || owner.profile_id !== user.profile.id) {
      throw new ForbiddenException(
        "Solo el propietario puede eliminar el concesionario",
      );
    }

    return true;
  }
}
