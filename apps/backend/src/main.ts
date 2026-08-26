import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['auth/tumblr', 'auth/tumblr/callback'],
  });

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  console.log('THE TOKEN IS:', process.env.NESTJS_SERVICE_TOKEN);
  
  const frontendDir = join(process.cwd(), 'public');

  app.use(express.static(frontendDir));

  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.method !== 'GET') return next();

      if (
        req.path.startsWith(`/${apiPrefix}`) ||
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/auth/tumblr')
      ) {
        return next();
      }

      res.sendFile(join(frontendDir, 'index.html'));
    },
  );

  const jwtAccessSecret = config.get<string>('auth.accessSecret') || 'tumblr_cookie_secret_fallback';
  app.use(cookieParser(jwtAccessSecret));

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });

  // Strips unknown properties and validates every incoming DTO automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger docs — protected with username + password
  const swaggerUsername = config.get<string>(
    'SWAGGER_USERNAME',
    'admin',
  );

  const swaggerPassword = config.get<string>(
    'SWAGGER_PASSWORD',
    '',
  );

  app.use(
    `/${apiPrefix}/docs`,
    basicAuth({
      challenge: true,
      users: {
        [swaggerUsername]: swaggerPassword,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Raasocial API')
    .setDescription('Backend API for the Raasocial AI platform')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup(
    `${apiPrefix}/docs`,
    app,
    document,
  );

  const port = config.get<number>('PORT', 4000);

  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(
    `RaaSocial backend running on http://localhost:${port}/${apiPrefix}`,
  );

  // eslint-disable-next-line no-console
  console.log(
    `Swagger docs available at http://localhost:${port}/${apiPrefix}/docs`,
  );
}

bootstrap();