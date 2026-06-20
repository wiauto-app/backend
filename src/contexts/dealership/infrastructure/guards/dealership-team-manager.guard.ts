import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";
import { DealershipInvitationRepository } from "../../domain/repositories/dealership-invitation.repository";
import { DealershipMemberRepository } from "../../domain/repositories/dealership-member.repository";

const resolve_dealership_id = (request: {
  body?: { dealership_id?: string };
  params?: { id?: string; dealership_id?: string };
  query?: { dealership_id?: string };
}): string | undefined => {
  return (
    request.body?.dealership_id ??
    request.params?.dealership_id ??
    (request.query?.dealership_id as string | undefined)
  );
};

@Injectable()
export class DealershipTeamManagerGuard implements CanActivate {
  constructor(
    private readonly dealership_member_repository: DealershipMemberRepository,
    private readonly dealership_invitation_repository: DealershipInvitationRepository,
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

    let dealership_id = resolve_dealership_id(request);

    if (!dealership_id && request.params?.id) {
      const invitation = await this.dealership_invitation_repository.findOne(
        request.params.id as string,
      );
      dealership_id = invitation?.dealership_id;
    }

    if (!dealership_id) {
      dealership_id = request.params?.id as string | undefined;
    }

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

    const member_role = membership.toPrimitives().role;
    if (member_role !== "owner" && member_role !== "admin") {
      throw new ForbiddenException("No tienes permiso para gestionar el equipo");
    }

    return true;
  }
}
