import { Component, DebugElement, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, BehaviorSubject } from 'rxjs';
import { CanDirective } from './can.directive';
import { AuthorizationService } from './authorization.service';

// Test host component
@Component({
    standalone: true,
    imports: [CanDirective],
    template: `
    <div id="single" *can="'students.read'">Single Permission Content</div>
    <div id="multiple-all" *can="['students.read', 'students.write']; mode: 'all'">All Mode Content</div>
    <div id="multiple-any" *can="['students.read', 'students.write']; mode: 'any'">Any Mode Content</div>
    <div id="with-else" *can="'admin.access'; else: noAccess">Admin Content</div>
    <ng-template #noAccess><div id="else-content">No Access</div></ng-template>
  `
})
class TestHostComponent {
    @ViewChild('noAccess') noAccessTemplate!: TemplateRef<any>;
}

describe('CanDirective', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let authService: jasmine.SpyObj<AuthorizationService>;
    let permissionSubject: BehaviorSubject<boolean>;

    beforeEach(async () => {
        permissionSubject = new BehaviorSubject<boolean>(true);

        authService = jasmine.createSpyObj('AuthorizationService', ['can$']);
        authService.can$.and.returnValue(permissionSubject.asObservable());

        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [
                { provide: AuthorizationService, useValue: authService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
    });

    describe('Single Permission', () => {
        it('should render content when permission is granted', () => {
            permissionSubject.next(true);
            fixture.detectChanges();

            const element = fixture.debugElement.query(By.css('#single'));
            expect(element).toBeTruthy();
            expect(element.nativeElement.textContent.trim()).toBe('Single Permission Content');
        });

        it('should not render content when permission is denied', () => {
            permissionSubject.next(false);
            fixture.detectChanges();

            const element = fixture.debugElement.query(By.css('#single'));
            expect(element).toBeFalsy();
        });

        it('should call AuthorizationService with correct parameters', () => {
            fixture.detectChanges();

            expect(authService.can$).toHaveBeenCalledWith(['students.read'], 'all');
        });

        it('should remove element from DOM when permission is denied', () => {
            permissionSubject.next(true);
            fixture.detectChanges();
            let element = fixture.debugElement.query(By.css('#single'));
            expect(element).toBeTruthy();

            permissionSubject.next(false);
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#single'));
            expect(element).toBeFalsy();
        });
    });

    describe('Multiple Permissions - All Mode', () => {
        it('should render content when all permissions are granted', () => {
            permissionSubject.next(true);
            fixture.detectChanges();

            const element = fixture.debugElement.query(By.css('#multiple-all'));
            expect(element).toBeTruthy();
            expect(element.nativeElement.textContent.trim()).toBe('All Mode Content');
        });

        it('should not render content when any permission is denied', () => {
            permissionSubject.next(false);
            fixture.detectChanges();

            const element = fixture.debugElement.query(By.css('#multiple-all'));
            expect(element).toBeFalsy();
        });

        it('should call AuthorizationService with all mode', () => {
            fixture.detectChanges();

            expect(authService.can$).toHaveBeenCalledWith(['students.read', 'students.write'], 'all');
        });
    });

    describe('Multiple Permissions - Any Mode', () => {
        it('should render content when at least one permission is granted', () => {
            permissionSubject.next(true);
            fixture.detectChanges();

            const element = fixture.debugElement.query(By.css('#multiple-any'));
            expect(element).toBeTruthy();
            expect(element.nativeElement.textContent.trim()).toBe('Any Mode Content');
        });

        it('should not render content when no permissions are granted', () => {
            permissionSubject.next(false);
            fixture.detectChanges();

            const element = fixture.debugElement.query(By.css('#multiple-any'));
            expect(element).toBeFalsy();
        });

        it('should call AuthorizationService with any mode', () => {
            fixture.detectChanges();

            expect(authService.can$).toHaveBeenCalledWith(['students.read', 'students.write'], 'any');
        });
    });

    describe('Else Template', () => {
        it('should render else template when permission is denied', () => {
            permissionSubject.next(false);
            fixture.detectChanges();

            const mainElement = fixture.debugElement.query(By.css('#with-else'));
            const elseElement = fixture.debugElement.query(By.css('#else-content'));

            expect(mainElement).toBeFalsy();
            expect(elseElement).toBeTruthy();
            expect(elseElement.nativeElement.textContent.trim()).toBe('No Access');
        });

        it('should render main template when permission is granted', () => {
            permissionSubject.next(true);
            fixture.detectChanges();

            const mainElement = fixture.debugElement.query(By.css('#with-else'));
            const elseElement = fixture.debugElement.query(By.css('#else-content'));

            expect(mainElement).toBeTruthy();
            expect(mainElement.nativeElement.textContent.trim()).toBe('Admin Content');
            expect(elseElement).toBeFalsy();
        });

        it('should switch between main and else templates reactively', () => {
            // Start with permission granted
            permissionSubject.next(true);
            fixture.detectChanges();
            let mainElement = fixture.debugElement.query(By.css('#with-else'));
            let elseElement = fixture.debugElement.query(By.css('#else-content'));
            expect(mainElement).toBeTruthy();
            expect(elseElement).toBeFalsy();

            // Change to permission denied
            permissionSubject.next(false);
            fixture.detectChanges();
            mainElement = fixture.debugElement.query(By.css('#with-else'));
            elseElement = fixture.debugElement.query(By.css('#else-content'));
            expect(mainElement).toBeFalsy();
            expect(elseElement).toBeTruthy();

            // Change back to permission granted
            permissionSubject.next(true);
            fixture.detectChanges();
            mainElement = fixture.debugElement.query(By.css('#with-else'));
            elseElement = fixture.debugElement.query(By.css('#else-content'));
            expect(mainElement).toBeTruthy();
            expect(elseElement).toBeFalsy();
        });
    });

    describe('Reactive Updates', () => {
        it('should update view when permissions change', () => {
            // Start with permission granted
            permissionSubject.next(true);
            fixture.detectChanges();
            let element = fixture.debugElement.query(By.css('#single'));
            expect(element).toBeTruthy();

            // Change to permission denied
            permissionSubject.next(false);
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#single'));
            expect(element).toBeFalsy();

            // Change back to permission granted
            permissionSubject.next(true);
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#single'));
            expect(element).toBeTruthy();
        });

        it('should handle rapid permission changes', () => {
            permissionSubject.next(true);
            fixture.detectChanges();
            permissionSubject.next(false);
            fixture.detectChanges();
            permissionSubject.next(true);
            fixture.detectChanges();
            permissionSubject.next(false);
            fixture.detectChanges();

            const element = fixture.debugElement.query(By.css('#single'));
            expect(element).toBeFalsy();
        });
    });

    describe('Empty Permission', () => {
        it('should handle empty string permission', () => {
            const emptyFixture = TestBed.createComponent(TestHostComponent);
            emptyFixture.componentInstance;

            permissionSubject.next(false);
            emptyFixture.detectChanges();

            // Should handle gracefully without errors
            expect(() => emptyFixture.detectChanges()).not.toThrow();
        });
    });

    describe('Cleanup', () => {
        it('should unsubscribe when directive is destroyed', () => {
            fixture.detectChanges();

            // Check that there is at least one observer subscribed
            expect(permissionSubject.observers.length).toBeGreaterThan(0);

            fixture.destroy();

            // After destroy, subscription should be cleaned up via takeUntil
            expect(permissionSubject.observers.length).toBe(0);
        });
    });
});
