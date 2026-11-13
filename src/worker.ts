import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "@/app/app.module";
import { envs } from "./common/envs";

/**
 * Proceso worker: mismo AppModule sin servidor HTTP. Con `APP_ROLE=worker`
 * consume colas pesadas (FFmpeg de vídeos) fuera del proceso de la API.
 */
async function bootstrap() {
  const logger = new Logger("Worker");
  if (envs.APP_ROLE === "api") {
    throw new Error(
      "El worker se ha arrancado con APP_ROLE=api: usa APP_ROLE=worker",
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  logger.log(`Worker listo (APP_ROLE=${envs.APP_ROLE}) 🛠️`);
}

bootstrap().catch((error: unknown) => {
  new Logger("Worker").error(
    "No se pudo arrancar el worker",
    error instanceof Error ? error.stack : String(error),
  );
  // Sin manejadores vivos el proceso termina con código de error
  process.exitCode = 1;
  throw error;
});
