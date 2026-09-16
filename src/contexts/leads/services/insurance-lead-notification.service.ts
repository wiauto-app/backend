import { Logger } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { envs } from "@/src/common/envs";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { MakesService } from "@/src/contexts/vehicles/catalog/makes/services/makes.service";
import { CatalogModelsService } from "@/src/contexts/vehicles/catalog/models/services/catalog-models.service";
import { CatalogVersionsService } from "@/src/contexts/vehicles/catalog/versions/services/catalog-versions.service";

import { GenericLeadEntity } from "../entities/lead.entity";

const NOT_AVAILABLE = "N/D";

@Injectable()
export class InsuranceLeadNotificationService {
  private readonly logger = new Logger(InsuranceLeadNotificationService.name);

  constructor(
    private readonly makes_service: MakesService,
    private readonly catalog_models_service: CatalogModelsService,
    private readonly catalog_versions_service: CatalogVersionsService,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async notify(lead: GenericLeadEntity): Promise<void> {
    const [make_name, model_name, version_name] = await Promise.all([
      this.resolve_make_name(lead.extra_data.catalog_make_id),
      this.resolve_model_name(lead.extra_data.catalog_model_id),
      this.resolve_version_name(lead.extra_data.version_id),
    ]);

    const license_plate =
      typeof lead.extra_data.license_plate === "string"
        ? lead.extra_data.license_plate
        : null;

    const payload = {
      lead: {
        first_name: lead.first_name,
        last_name: lead.last_name,
        dni: lead.dni,
        phone: lead.phone,
        email: lead.email,
        license_plate,
        make_name,
        model_name,
        version_name,
      },
      created_at: lead.created_at.toISOString(),
    };

    try {
      await Promise.all(
        envs.ADMIN_ALERTS_EMAILS.map((to) =>
          this.outbound_mail_enqueue_service.enqueue_insurance_lead_notification({
            to,
            ...payload,
          }),
        ),
      );
    } catch (error) {
      this.logger.error(
        `No se pudo encolar la notificación de lead de seguro ${lead.id}`,
        error as Error,
      );
    }
  }

  private async resolve_make_name(raw_id: unknown): Promise<string> {
    const id = this.to_id(raw_id);
    if (id === null) {
      return NOT_AVAILABLE;
    }

    try {
      const { make } = await this.makes_service.findOne(id);
      return make.name;
    } catch {
      return NOT_AVAILABLE;
    }
  }

  private async resolve_model_name(raw_id: unknown): Promise<string> {
    const id = this.to_id(raw_id);
    if (id === null) {
      return NOT_AVAILABLE;
    }

    try {
      const { model } = await this.catalog_models_service.findOne(id);
      return model.name;
    } catch {
      return NOT_AVAILABLE;
    }
  }

  private async resolve_version_name(raw_id: unknown): Promise<string> {
    const id = this.to_id(raw_id);
    if (id === null) {
      return NOT_AVAILABLE;
    }

    try {
      const { version } = await this.catalog_versions_service.findOne(id);
      return version.name;
    } catch {
      return NOT_AVAILABLE;
    }
  }

  private to_id(raw_id: unknown): number | null {
    const id = Number(raw_id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
}
