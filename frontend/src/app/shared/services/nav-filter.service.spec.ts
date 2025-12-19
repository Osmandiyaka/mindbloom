import { TestBed } from '@angular/core/testing';
import { NavFilterService, NavSection } from './nav-filter.service';
import { EntitlementsService } from './entitlements.service';
import { AuthorizationService } from '../security/authorization.service';

describe('NavFilterService', () => {
    let service: NavFilterService;
    let entitlementsService: jasmine.SpyObj<EntitlementsService>;
    let authorizationService: jasmine.SpyObj<AuthorizationService>;

    const mockNavSections: NavSection[] = [
        {
            title: 'Main',
            items: [
                { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', moduleKey: 'dashboard' }
            ]
        },
        {
            title: 'Students',
            items: [
                { label: 'Students', path: '/students', icon: 'students', moduleKey: 'students', permission: 'students:read' },
                { label: 'Admissions', path: '/admissions', icon: 'admissions', moduleKey: 'admissions', permission: 'admissions:read' }
            ]
        },
        {
            title: 'Finance',
            items: [
                { label: 'Fees', path: '/fees', icon: 'fees', moduleKey: 'fees', permission: 'fees:read' },
                { label: 'Accounting', path: '/accounting', icon: 'accounting', moduleKey: 'accounting', permission: 'accounting:read' }
            ]
        },
        {
            title: 'HR',
            items: [
                { label: 'HR', path: '/hr', icon: 'hr', moduleKey: 'hr', permission: 'hr:read' }
            ]
        }
    ];

    beforeEach(() => {
        const entitlementsServiceSpy = jasmine.createSpyObj('EntitlementsService', ['isEnabled']);
        const authorizationServiceSpy = jasmine.createSpyObj('AuthorizationService', ['can']);

        TestBed.configureTestingModule({
            providers: [
                NavFilterService,
                { provide: EntitlementsService, useValue: entitlementsServiceSpy },
                { provide: AuthorizationService, useValue: authorizationServiceSpy }
            ]
        });

        service = TestBed.inject(NavFilterService);
        entitlementsService = TestBed.inject(EntitlementsService) as jasmine.SpyObj<EntitlementsService>;
        authorizationService = TestBed.inject(AuthorizationService) as jasmine.SpyObj<AuthorizationService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('filterNavigationSync', () => {
        it('should show all items when all modules are enabled and all permissions granted', () => {
            entitlementsService.isEnabled.and.returnValue(true);
            authorizationService.can.and.returnValue(true);

            const filtered = service.filterNavigationSync(mockNavSections);

            expect(filtered.length).toBe(4); // All sections visible
            expect(filtered[0].items.length).toBe(1); // Dashboard
            expect(filtered[1].items.length).toBe(2); // Students + Admissions
            expect(filtered[2].items.length).toBe(2); // Fees + Accounting
            expect(filtered[3].items.length).toBe(1); // HR
        });

        it('should hide items when module is disabled', () => {
            // Enable dashboard and students, disable rest
            entitlementsService.isEnabled.and.callFake((moduleKey: string) => {
                return moduleKey === 'dashboard' || moduleKey === 'students' || moduleKey === 'admissions';
            });
            authorizationService.can.and.returnValue(true);

            const filtered = service.filterNavigationSync(mockNavSections);

            expect(filtered.length).toBe(2); // Main + Students sections only
            expect(filtered[0].title).toBe('Main');
            expect(filtered[1].title).toBe('Students');
        });

        it('should hide items when user lacks permission', () => {
            entitlementsService.isEnabled.and.returnValue(true);
            // Only grant dashboard and students:read
            authorizationService.can.and.callFake((permission: string) => {
                return !permission || permission === 'students:read';
            });

            const filtered = service.filterNavigationSync(mockNavSections);

            expect(filtered.length).toBe(2); // Main + Students sections
            expect(filtered[1].items.length).toBe(1); // Only Students, not Admissions
            expect(filtered[1].items[0].label).toBe('Students');
        });

        it('should hide entire section when all items are filtered out', () => {
            entitlementsService.isEnabled.and.returnValue(true);
            // Grant no permissions (except items without permission requirement)
            authorizationService.can.and.returnValue(false);

            const filtered = service.filterNavigationSync(mockNavSections);

            expect(filtered.length).toBe(1); // Only Main section (dashboard has no permission)
            expect(filtered[0].title).toBe('Main');
        });

        it('should handle items without moduleKey', () => {
            entitlementsService.isEnabled.and.returnValue(false); // Disable all modules
            authorizationService.can.and.returnValue(true);

            const sectionsWithoutModuleKey: NavSection[] = [
                {
                    title: 'Main',
                    items: [
                        { label: 'Home', path: '/', icon: 'home' } // No moduleKey
                    ]
                }
            ];

            const filtered = service.filterNavigationSync(sectionsWithoutModuleKey);

            expect(filtered.length).toBe(1);
            expect(filtered[0].items.length).toBe(1);
        });

        it('should handle items without permission', () => {
            entitlementsService.isEnabled.and.returnValue(true);
            authorizationService.can.and.returnValue(false); // Deny all permissions

            const sectionsWithoutPermission: NavSection[] = [
                {
                    title: 'Main',
                    items: [
                        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', moduleKey: 'dashboard' } // No permission
                    ]
                }
            ];

            const filtered = service.filterNavigationSync(sectionsWithoutPermission);

            expect(filtered.length).toBe(1);
            expect(filtered[0].items.length).toBe(1); // Should show since no permission required
        });

        it('should filter based on both module and permission', () => {
            // Enable only students module
            entitlementsService.isEnabled.and.callFake((moduleKey: string) => {
                return moduleKey === 'dashboard' || moduleKey === 'students';
            });
            // Grant only students:read permission
            authorizationService.can.and.callFake((permission: string) => {
                return !permission || permission === 'students:read';
            });

            const filtered = service.filterNavigationSync(mockNavSections);

            expect(filtered.length).toBe(2); // Main + Students
            expect(filtered[1].items.length).toBe(1); // Only Students (admissions filtered by permission)
            expect(filtered[1].items[0].label).toBe('Students');
        });
    });

    describe('isModuleVisible', () => {
        it('should return true for enabled module', () => {
            entitlementsService.isEnabled.and.returnValue(true);
            expect(service.isModuleVisible('students')).toBe(true);
        });

        it('should return false for disabled module', () => {
            entitlementsService.isEnabled.and.returnValue(false);
            expect(service.isModuleVisible('hr')).toBe(false);
        });
    });

    describe('hasPermissionForItem', () => {
        it('should return true if item has no permission requirement', () => {
            const item = { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' };
            expect(service.hasPermissionForItem(item)).toBe(true);
        });

        it('should return true if user has required permission', () => {
            authorizationService.can.and.returnValue(true);
            const item = { label: 'Students', path: '/students', icon: 'students', permission: 'students:read' };
            expect(service.hasPermissionForItem(item)).toBe(true);
        });

        it('should return false if user lacks required permission', () => {
            authorizationService.can.and.returnValue(false);
            const item = { label: 'Students', path: '/students', icon: 'students', permission: 'students:read' };
            expect(service.hasPermissionForItem(item)).toBe(false);
        });
    });

    describe('Trial plan scenario', () => {
        it('should show only trial-tier modules', () => {
            // Simulate trial plan: dashboard, students, admissions, academics, attendance, setup
            entitlementsService.isEnabled.and.callFake((moduleKey: string) => {
                return ['dashboard', 'students', 'admissions', 'academics', 'attendance', 'setup'].includes(moduleKey);
            });
            authorizationService.can.and.returnValue(true);

            const filtered = service.filterNavigationSync(mockNavSections);

            // Should have Main + Students sections, but not Finance or HR
            expect(filtered.length).toBe(2);
            expect(filtered[0].title).toBe('Main');
            expect(filtered[1].title).toBe('Students');
        });
    });

    describe('Premium plan scenario', () => {
        it('should show premium-tier modules but hide enterprise modules', () => {
            // Simulate premium plan: includes fees, accounting, finance, but not hr, payroll, hostel, transport, roles
            entitlementsService.isEnabled.and.callFake((moduleKey: string) => {
                return !['hr', 'payroll', 'hostel', 'transport', 'roles'].includes(moduleKey);
            });
            authorizationService.can.and.returnValue(true);

            const filtered = service.filterNavigationSync(mockNavSections);

            // Should have Main, Students, Finance sections, but not HR
            expect(filtered.length).toBe(3);
            expect(filtered.some(s => s.title === 'HR')).toBe(false);
        });
    });
});
