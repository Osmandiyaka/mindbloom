#!/usr/bin/env node

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../backend/dist/app.module');

async function run() {
    const app = await NestFactory.createApplicationContext(AppModule);
    try {
        const createTenantUseCase = app.get('CreateTenantUseCase');

        const tenant = await createTenantUseCase.execute({
            name: 'Summit Debug',
            subdomain: 'summit-debug',
            plan: 'enterprise',
            contactEmail: 'admin@summit-debug.test',
            adminName: 'Debug Admin',
            adminEmail: 'admin@summit-debug.test',
            adminPassword: 'admin123',
        });

        console.log('Tenant created:', tenant.id);
    } catch (err) {
        console.error('Error executing CreateTenantUseCase:');
        console.error(err.stack || err);
    } finally {
        await app.close();
    }
}

run().catch(err => {
    console.error('Fatal error:', err.stack || err);
    process.exit(1);
});