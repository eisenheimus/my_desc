import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const accessToken = process.env.TOKEN;
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (accessToken && req.headers['x-access-token'] !== accessToken) {
      return res.status(401).json({ message: 'Invalid access token' });
    }
    next();
  });
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8000,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Kanban API is running on http://localhost:${port}/api`);
}
bootstrap();
