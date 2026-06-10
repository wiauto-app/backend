import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";
import { ProfileRepository } from "@/src/contexts/profiles/domain/repositories/profile.repository";

import { AlertRepository } from "../../domain/alert.repository";
import { Alert, PrimitiveAlert } from "../../domain/entities/alert";
import { mapToAlertFilters } from "../mappers/map-alert-filters";
import { CreateAlertDto } from "./create-alert.dto";

@Injectable()
export class CreateAlertUseCase {
  constructor(
    private readonly alert_repository: AlertRepository,
    private readonly profile_repository: ProfileRepository,
  ) {}

  async execute(dto: CreateAlertDto): Promise<PrimitiveAlert> {
    const profile = await this.profile_repository.findOne(dto.profile_id);
    if (!profile) {
      throw new ValidationException("Perfil de usuario no encontrado");
    }

    const profile_primitive = profile.toPrimitives();
    const profile_email = profile_primitive.user?.email?.trim();
    const email = dto.email?.trim() || profile_email;

    if (!email) {
      throw new ValidationException("El correo es obligatorio para crear una alerta");
    }

    const filters = dto.filters ?? mapToAlertFilters(dto);
    if (Object.keys(filters).length === 0) {
      throw new ValidationException("Debes definir al menos un filtro para la alerta");
    }

    const alert = Alert.create({
      name: dto.name.trim(),
      profile_id: dto.profile_id,
      email,
      phone: dto.phone.trim(),
      phone_code: dto.phone_code.trim(),
      filters,
    });

    await this.alert_repository.save(alert);
    return alert.toPrimitives();
  }
}
