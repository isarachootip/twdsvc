import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or any origin
      callback(null, true);
    },
    credentials: true,
  });

  const port = process.env.API_PORT || (process.env.APP_TARGET === 'api' ? process.env.PORT : null) || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 SVCM API is running on http://0.0.0.0:${port}/api/v1`);
}

bootstrap();
