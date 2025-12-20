import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
    async confirm(message: string): Promise<boolean> {
        return Promise.resolve(window.confirm(message));
    }
}
