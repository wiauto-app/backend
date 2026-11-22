// Debe ir primero: captura también errores al cargar módulos (p. ej. `envs`)
import "./common/fatal-log/register";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import cookieParser from "cookie-parser";
import passport from "passport";
import compression from "compression";

import { AppModule } from "@/app/app.module";
// import { envs } from "@/src/common/envs";
import { ResponseInterceptor } from "./contexts/shared/interceptors/response.interceptor";
import { HttpErrorFilter } from "./contexts/shared/exceptions/HttpErrorFilter";
import { envs } from "./common/envs";
import { writeFatalLog } from "./common/fatal-log/fatal-log";

const FRONTEND_ORIGINS = new Set((
  process.env.FRONTEND_ORIGINS ??
  "http://localhost:3000,http://localhost:5174,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean));

async function bootstrap() {
  // Dejamos que Nest maneje los body parsers internamente
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.useSecurityHeaders({
    contentSecurityPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    strictTransportSecurity:
      envs.ENVIRONMENT === "production"
        ? { maxAge: 315_360_000, includeSubDomains: true }
        : false,
  });


  // 1. Fundamental para leer las cookies de Next.js
  app.use(cookieParser());

  // 2. CORS Seguro y compatible con credentials: true
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || FRONTEND_ORIGINS.has(origin)) {
        callback(null, true);
      } else {
        console.log(`Origen ${origin} no permitido por CORS`);
        callback(null,false);
      }
    },
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Record-Search'],
    exposedHeaders: ['Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());
  app.use(compression());

  app.use(passport.initialize());

  // SIGTERM (docker stop / redeploy): cierra el servidor HTTP y conexiones
  // DB/Redis de forma ordenada en vez de cortar peticiones en vuelo.
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.get<string>("PORT", "3000");

  await app.listen(port, "0.0.0.0");

  const logger = app.get(Logger);
  logger.log(`App is ready and listening on port ${port} 🚀`);
}

bootstrap().catch((error: unknown) => {
  writeFatalLog("bootstrapFailure", error);
  // Salida explícita: conexiones a medio abrir (DB/Redis) mantendrían vivo el
  // proceso y Docker nunca lo reiniciaría.
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});