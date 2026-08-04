import { Injectable, Logger } from "@nestjs/common";

import { OutboundMailEnqueueService } from "../../shared/mail/outbound-mail-enqueue.service";
import type { OutboundMailNewLoginAudience } from "../../shared/mail/queues/outbound-mail.queue.constants";

export interface EnqueueUserWelcomeOptions {
  to: string;
  name?: string;
}

export interface EnqueueNewLoginOptions {
  to: string;
  ip_address?: string | null;
  user_agent?: string | null;
  audience: OutboundMailNewLoginAudience;
  occurred_at?: Date | string;
}

export interface EnqueuePasswordChangedOptions {
  to: string;
  occurred_at?: Date | string;
}

export interface EnqueueAccountDeletedOptions {
  to: string;
  occurred_at?: Date | string;
}

@Injectable()
export class AuthSecurityMailService {
  private readonly logger = new Logger(AuthSecurityMailService.name);

  constructor(
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  enqueueUserWelcome(options: EnqueueUserWelcomeOptions): void {
    void this.outbound_mail_enqueue_service
      .enqueue_user_welcome({
        to: options.to,
        name: options.name,
      })
      .catch((error: unknown) => {
        this.logger.error(
          `No se pudo encolar el correo de bienvenida a ${options.to}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  enqueueNewLogin(options: EnqueueNewLoginOptions): void {
    const occurred_at = this.toIso(options.occurred_at);
    void this.outbound_mail_enqueue_service
      .enqueue_new_login({
        to: options.to,
        ip_address: options.ip_address ?? null,
        user_agent: options.user_agent ?? null,
        occurred_at,
        audience: options.audience,
      })
      .catch((error: unknown) => {
        this.logger.error(
          `No se pudo encolar el aviso de nuevo inicio de sesión a ${options.to}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  enqueuePasswordChanged(options: EnqueuePasswordChangedOptions): void {
    const occurred_at = this.toIso(options.occurred_at);
    void this.outbound_mail_enqueue_service
      .enqueue_password_changed({
        to: options.to,
        occurred_at,
      })
      .catch((error: unknown) => {
        this.logger.error(
          `No se pudo encolar el aviso de cambio de contraseña a ${options.to}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  enqueueAccountDeleted(options: EnqueueAccountDeletedOptions): void {
    const occurred_at = this.toIso(options.occurred_at);
    void this.outbound_mail_enqueue_service
      .enqueue_account_deleted({
        to: options.to,
        occurred_at,
      })
      .catch((error: unknown) => {
        this.logger.error(
          `No se pudo encolar el aviso de eliminación de cuenta a ${options.to}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  private toIso(value?: Date | string): string {
    if (!value) {
      return new Date().toISOString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }
}
