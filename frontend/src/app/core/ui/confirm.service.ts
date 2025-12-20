import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
    async confirm(message: string): Promise<boolean> {
        // Minimal implementation now; replace with modal later if desired
        return Promise.resolve(window.confirm(message));
    }
}
