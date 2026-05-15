import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar prefijo global de API
  app.setGlobalPrefix('api');

  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'https://elsaman.netlify.app',
      'https://elsaman.online',
      'https://api.elsaman.online',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Configurar validaciÃ³n global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('SAMAN API')
    .setDescription('API para el sistema de gestiÃ³n de inventario SAMAN')
    .setVersion('1.0.0')
    .addTag('auth', 'Endpoints de autenticaciÃ³n')
    .addTag('productos', 'GestiÃ³n de productos')
    .addTag('bodegas', 'GestiÃ³n de bodegas')
    .addTag('movimientos', 'GestiÃ³n de movimientos de inventario')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT || 8080);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api`);
}
bootstrap();
