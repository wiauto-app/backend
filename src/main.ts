import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import cookieParser from "cookie-parser";
import passport from "passport";
import compression from "compression";

import { AppModule } from "@/app/app.module";
import { ResponseInterceptor } from "./contexts/shared/interceptors/response.interceptor";
import { HttpErrorFilter } from "./contexts/shared/exceptions/HttpErrorFilter";

const FRONTEND_ORIGINS = new Set((
  process.env.FRONTEND_ORIGINS ??
  "http://localhost:3000,http://localhost:5174,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean));

async function bootstrap() {
  // Dejamos que Nest maneje los body parsers internamente
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // 1. Fundamental para leer las cookies de Next.js
  app.use(cookieParser());

  // 2. CORS Seguro y compatible con credentials: true
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || FRONTEND_ORIGINS.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origen ${origin} no permitido por CORS`));
      }
    },
    allowedHeaders: ['Authorization', 'Content-Type'],
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

  const configService = app.get(ConfigService);
  const port = configService.get<string>("PORT", "3000");

  await app.listen(port, "0.0.0.0");

  const logger = app.get(Logger);
  logger.log(`App is ready and listening on port ${port} 🚀`);
}

bootstrap().catch(handleError);

function handleError(error: unknown) {
  console.error(error);
  throw error;
}

process.on("uncaughtException", handleError);