import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import cookieParser from "cookie-parser";
import passport from "passport";
import express from 'express';
import compression from 'compression';

import { AppModule } from "@/app/app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule,{
    rawBody: true,
    bodyParser: true,
  });

  app.enableCors();
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

  app.use(cookieParser());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());
  // app.use(passport.session());

  const configService = app.get(ConfigService);
  const port = configService.get<string>("PORT", "3000");

  await app.listen(port, "0.0.0.0");

  const logger = app.get(Logger);
  logger.log(`App is ready and listening on port ${port} 🚀`);
}

bootstrap().catch(handleError);

function handleError(error: unknown) {
  // eslint-disable-next-line no-console
  console.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}

process.on("uncaughtException", handleError);
