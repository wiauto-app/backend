import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

const DB_PING_TIMEOUT_MS = 3000;

@Controller("health")
export class HealthController {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Liveness: el proceso responde. Sin log: se llama cada pocos segundos. */
  @Get()
  @HttpCode(200)
  run() {
    return { status: "ok" };
  }

  /**
   * Readiness: el proceso puede atender tráfico real (Postgres responde).
   * Lo usa el healthcheck de Docker y debería usarlo el reverse proxy para no
   * enrutar peticiones a una instancia que acaba de arrancar o está degradada.
   */
  @Get("ready")
  @HttpCode(200)
  async ready() {
    try {
      await this.pingDatabase();
      return { status: "ok", database: "up" };
    } catch (error) {
      this.logger.warn(
        `Readiness KO: ${error instanceof Error ? error.message : String(error)}`,
        HealthController.name,
      );
      throw new ServiceUnavailableException("Servicio no disponible");
    }
  }

  private async pingDatabase(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      throw new Error("DataSource no inicializado");
    }

    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Postgres no respondió en ${DB_PING_TIMEOUT_MS}ms`));
      }, DB_PING_TIMEOUT_MS);
    });

    try {
      await Promise.race([this.dataSource.query("SELECT 1"), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
