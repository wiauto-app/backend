import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { DealershipMemberRepository } from "../../domain/repositories/dealership-member.repository";
import { Request } from "express";
import { CreateDealershipInvitationHttpDto } from "../http-api/invitations-v1/create-dealership-invitation/create-dealership-invitation.http-dto";


export class DealerShipOwnerGuard implements CanActivate {
  constructor(
    private readonly dealership_member_repository: DealershipMemberRepository,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
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

    const body = request.body as CreateDealershipInvitationHttpDto;
    const dealership_id = body.dealership_id;
    const dealership_member = await this.dealership_member_repository.findOwnerMemberByDealershipId(dealership_id, "owner");

    if (!dealership_member) {
      throw new UnauthorizedException("Miembro no encontrado");
    }
    if (dealership_member.toPrimitives().profile_id !== user.profile.id) {
      throw new UnauthorizedException("Miembro no autorizado");
    }

    return true;


  }
}