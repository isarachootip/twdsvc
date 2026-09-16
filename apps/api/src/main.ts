import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [webUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 SVCM API is running on http://localhost:${port}/api/v1`);
}

bootstrap();
