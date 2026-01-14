import { ContextIdFactory, NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as path from 'path';
import { InitializeGlobalRolesUseCase, InitializeSystemRolesUseCase } from './application/services/rbac';
import { validateEntitlementsRegistry } from './domain/entitlements/entitlements.registry';

async function bootstrap() {
    validateEntitlementsRegistry();
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');

    // Global prefix
    app.setGlobalPrefix('api');

    app.use(cookieParser());

    // CORS
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:4200',
        credentials: true,
    });

    // Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    // Swagger Documentation
    const config = new DocumentBuilder()
        .setTitle('MindBloom API')
        .setDescription('School Management System API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Serve local storage files when using local driver
    const storageRoot = process.env.FILE_STORAGE_ROOT || path.join(process.cwd(), 'storage');
    app.use('/files', express.static(storageRoot));

    // Ensure system/global roles exist before serving
    try {
        const contextId = ContextIdFactory.create();
        const initializeGlobalRoles = await app.resolve(InitializeGlobalRolesUseCase, contextId);
        const globalRoles = await initializeGlobalRoles.execute();
        logger.log(`Global roles ready (${globalRoles.length})`);

        const initializeSystemRoles = await app.resolve(InitializeSystemRolesUseCase, contextId);
        const systemRoles = await initializeSystemRoles.execute('global-seed');
        logger.log(`System roles initialized (${systemRoles.length})`);
    } catch (err) {
        logger.error('Failed to initialize roles', err?.stack || String(err));
        throw err;
    }

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}/api`);
    console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
