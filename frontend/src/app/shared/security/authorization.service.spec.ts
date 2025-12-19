import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthorizationService } from './authorization.service';
import { RbacService } from '../../core/rbac/rbac.service';

describe('AuthorizationService', () => {
    let service: AuthorizationService;
    let rbacService: jasmine.SpyObj<RbacService>;

    beforeEach(() => {
        rbacService = jasmine.createSpyObj('RbacService', ['canAll', 'canAny', 'canAll$', 'canAny$']);

        TestBed.configureTestingModule({
            providers: [
                AuthorizationService,
                { provide: RbacService, useValue: rbacService }
            ]
        });

        service = TestBed.inject(AuthorizationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('can() - Synchronous', () => {
        it('should call canAll for single permission with all mode', () => {
            rbacService.canAll.and.returnValue(true);

            const result = service.can('students.read', 'all');

            expect(rbacService.canAll).toHaveBeenCalledWith(['students.read']);
            expect(result).toBe(true);
        });

        it('should call canAll for multiple permissions with all mode', () => {
            rbacService.canAll.and.returnValue(true);

            const result = service.can(['students.read', 'students.write'], 'all');

            expect(rbacService.canAll).toHaveBeenCalledWith(['students.read', 'students.write']);
            expect(result).toBe(true);
        });

        it('should call canAny for single permission with any mode', () => {
            rbacService.canAny.and.returnValue(true);

            const result = service.can('students.read', 'any');

            expect(rbacService.canAny).toHaveBeenCalledWith(['students.read']);
            expect(result).toBe(true);
        });

        it('should call canAny for multiple permissions with any mode', () => {
            rbacService.canAny.and.returnValue(false);

            const result = service.can(['students.read', 'students.write'], 'any');

            expect(rbacService.canAny).toHaveBeenCalledWith(['students.read', 'students.write']);
            expect(result).toBe(false);
        });

        it('should default to all mode', () => {
            rbacService.canAll.and.returnValue(true);

            service.can('students.read');

            expect(rbacService.canAll).toHaveBeenCalled();
        });
    });

    describe('can$() - Reactive', () => {
        it('should call canAll$ for single permission with all mode', (done) => {
            rbacService.canAll$.and.returnValue(of(true));

            service.can$('students.read', 'all').subscribe(result => {
                expect(rbacService.canAll$).toHaveBeenCalledWith(['students.read']);
                expect(result).toBe(true);
                done();
            });
        });

        it('should call canAll$ for multiple permissions with all mode', (done) => {
            rbacService.canAll$.and.returnValue(of(true));

            service.can$(['students.read', 'students.write'], 'all').subscribe(result => {
                expect(rbacService.canAll$).toHaveBeenCalledWith(['students.read', 'students.write']);
                expect(result).toBe(true);
                done();
            });
        });

        it('should call canAny$ for single permission with any mode', (done) => {
            rbacService.canAny$.and.returnValue(of(false));

            service.can$('students.read', 'any').subscribe(result => {
                expect(rbacService.canAny$).toHaveBeenCalledWith(['students.read']);
                expect(result).toBe(false);
                done();
            });
        });

        it('should call canAny$ for multiple permissions with any mode', (done) => {
            rbacService.canAny$.and.returnValue(of(true));

            service.can$(['students.read', 'students.write'], 'any').subscribe(result => {
                expect(rbacService.canAny$).toHaveBeenCalledWith(['students.read', 'students.write']);
                expect(result).toBe(true);
                done();
            });
        });

        it('should default to all mode', (done) => {
            rbacService.canAll$.and.returnValue(of(false));

            service.can$('students.read').subscribe(result => {
                expect(rbacService.canAll$).toHaveBeenCalled();
                expect(result).toBe(false);
                done();
            });
        });

        it('should emit updated values when rbacService emits', (done) => {
            let emissionCount = 0;
            rbacService.canAll$.and.returnValue(of(true, false, true));

            service.can$('students.read', 'all').subscribe(result => {
                emissionCount++;
                if (emissionCount === 1) {
                    expect(result).toBe(true);
                } else if (emissionCount === 2) {
                    expect(result).toBe(false);
                } else if (emissionCount === 3) {
                    expect(result).toBe(true);
                    done();
                }
            });
        });
    });

    describe('canMultiple() - Complex Checks', () => {
        it('should evaluate multiple permission checks with different modes', () => {
            rbacService.canAll.and.returnValue(true);
            rbacService.canAny.and.returnValue(false);

            const checks = [
                { permissions: ['students.read'], mode: 'all' as const },
                { permissions: ['admin.access', 'hr.access'], mode: 'any' as const }
            ];

            const result = service.canMultiple(checks);

            expect(rbacService.canAll).toHaveBeenCalledWith(['students.read']);
            expect(rbacService.canAny).toHaveBeenCalledWith(['admin.access', 'hr.access']);
            expect(result).toBe(false); // Second check returned false
        });

        it('should return true only if all checks pass', () => {
            rbacService.canAll.and.returnValue(true);
            rbacService.canAny.and.returnValue(true);

            const checks = [
                { permissions: ['students.read'], mode: 'all' as const },
                { permissions: ['fees.read'], mode: 'any' as const }
            ];

            const result = service.canMultiple(checks);

            expect(result).toBe(true);
        });

        it('should return false if any check fails', () => {
            rbacService.canAll.and.returnValue(true);
            rbacService.canAny.and.returnValue(false);

            const checks = [
                { permissions: ['students.read'], mode: 'all' as const },
                { permissions: ['admin.access'], mode: 'any' as const }
            ];

            const result = service.canMultiple(checks);

            expect(result).toBe(false);
        });

        it('should handle empty checks array', () => {
            const result = service.canMultiple([]);

            expect(result).toBe(true); // No checks means no failures
            expect(rbacService.canAll).not.toHaveBeenCalled();
            expect(rbacService.canAny).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty permission string', () => {
            rbacService.canAll.and.returnValue(false);

            const result = service.can('');

            expect(rbacService.canAll).toHaveBeenCalledWith(['']);
            expect(result).toBe(false);
        });

        it('should handle empty permissions array', () => {
            const result = service.can([]);

            // Empty array means no permissions required, should return true without calling rbacService
            expect(rbacService.canAll).not.toHaveBeenCalled();
        });

        it('should handle whitespace-only permission', () => {
            rbacService.canAll.and.returnValue(false);

            const result = service.can('   ');

            expect(rbacService.canAll).toHaveBeenCalledWith(['   ']);
            expect(result).toBe(false);
        });
    });
});
