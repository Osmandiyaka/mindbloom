import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { tenantContextInterceptor } from './core/interceptors/tenant-context.interceptor';
import { schoolContextInterceptor } from './core/interceptors/school-context.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideAnimations(),
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([authInterceptor, tenantContextInterceptor, schoolContextInterceptor])
        )
    ]
};
