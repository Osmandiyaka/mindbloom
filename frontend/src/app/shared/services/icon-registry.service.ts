import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class IconRegistryService {
  private icons = new Map<string, SafeHtml>();

  constructor(private sanitizer: DomSanitizer) {
    this.registerDefaults();
  }

  icon(name: string): SafeHtml | undefined {
    return this.icons.get(name) || this.icons.get('default');
  }

  private addIcon(name: string, paths: string[]) {
    const body = paths.map(p => `<path d="${p}" />`).join('');
    this.icons.set(
      name,
      this.sanitizer.bypassSecurityTrustHtml(
        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
      )
    );
  }

  private registerDefaults() {
    this.addIcon('dashboard', ['M4 4h7v7H4z', 'M13 4h7v5h-7z', 'M13 11h7v9h-7z', 'M4 13h7v7H4z']);
    this.addIcon('students', ['M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z', 'M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1']);
    this.addIcon('admissions', ['M4 5h16v14H4z', 'M9 3v4', 'M15 3v4', 'M7 10h10', 'M7 14h6']);
    this.addIcon('academics', ['M4 7l8-4 8 4-8 4z', 'M4 7v6l8 4 8-4V7']);
    this.addIcon('attendance', ['M5 5h14v14H5z', 'M9 11l2 2 4-4']);
    this.addIcon('accounting', ['M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M4 7l4 5h8l4-5']);
    this.addIcon('hr', ['M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z', 'M4 21v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1']);
    this.addIcon('library', ['M5 4h4v16H5z', 'M11 4h4v16h-4z', 'M17 4h2v16h-2z']);
    this.addIcon('hostel', ['M4 20v-9l8-5 8 5v9', 'M9 20v-5h6v5']);
    this.addIcon('transport', ['M3 13h18v5H3z', 'M5 13l2-5h10l2 5', 'M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', 'M17 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z']);
    this.addIcon('settings', ['M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zm0-5.5v2', 'M12 19v2', 'M4.22 4.22l1.42 1.42', 'M18.36 18.36l1.42 1.42', 'M2 12h2', 'M20 12h2', 'M4.22 19.78l1.42-1.42', 'M18.36 5.64l1.42-1.42']);
    this.addIcon('marketplace', ['M3 5h18l-1.5 6.5H4.5z', 'M6 11.5v7.5h12v-7.5']);
    this.addIcon('plugins', ['M8 3h8v8h-3v2.5A2.5 2.5 0 0 1 10.5 16H8z']);
    this.addIcon('tasks', ['M4 6h10', 'M4 12h6', 'M4 18h4', 'M14 9l2 2 4-4']);
    this.addIcon('fees', ['M4 5h12a2 2 0 0 1 2 2v12l-4-3-4 3V7a2 2 0 0 0-2-2H4z']);
    this.addIcon('assignment', ['M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.33 0-6 1.34-6 3v1h12v-1c0-1.66-2.67-3-6-3z']);
    this.addIcon('collection', ['M3 7h18v10H3z', 'M3 10h18']);
    this.addIcon('reports', ['M5 19V9', 'M11 19V5', 'M17 19v-8']);
    this.addIcon('journal', ['M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M7 9h10', 'M7 13h10', 'M7 17h6']);
    this.addIcon('expense', ['M6 3h12v18l-3-2-3 2-3-2-3 2z', 'M9 7h6', 'M9 11h6']);
    this.addIcon('bill', ['M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M4 7l4.5 5h7L20 7']);
    this.addIcon('bank', ['M12 5l9 4H3z', 'M3 9h18', 'M5 9v8', 'M9 9v8', 'M13 9v8', 'M17 9v8', 'M3 17h18']);
    this.addIcon('payroll', ['M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M9 6h6a2 2 0 0 1 2 2v2H7V8a2 2 0 0 1 2-2z']);
    this.addIcon('trial', ['M6 4l6-2 6 2', 'M6 4l-3 5h6l-3-5z', 'M18 4l-3 5h6l-3-5z', 'M6 9v9a3 3 0 0 0 6 0V9', 'M12 9v9a3 3 0 0 0 6 0V9']);
    this.addIcon('period', ['M12 6a6 6 0 1 1-6 6 6 6 0 0 1 6-6zm0 2v4l3 1']);
    this.addIcon('alarm', ['M12 7a5 5 0 1 1-5 5 5 5 0 0 1 5-5zm0 0V4', 'M5 5 3 7', 'M19 5l2 2']);
    this.addIcon('inbox', ['M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M4 7l4 5h8l4-5']);
    this.addIcon('calendar', ['M7 3v3', 'M17 3v3', 'M4 8h16', 'M5 5h14a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1z']);
    this.addIcon('briefcase', ['M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M9 6h6a2 2 0 0 1 2 2v2H7V8a2 2 0 0 1 2-2z']);
    this.addIcon('search', ['M11 4a7 7 0 1 1-7 7 7 7 0 0 1 7-7z', 'm21 21-4.35-4.35']);
    this.addIcon('logout', ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9']);
    this.addIcon('default', ['M12 3a9 9 0 1 1-9 9 9 9 0 0 1 9-9z']);
  }
}
