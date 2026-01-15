import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PlanEntitlementsComponent } from './plan-entitlements.component';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { EditionService } from '../../../../shared/services/entitlements.service';

describe('PlanEntitlementsComponent', () => {
    let fixture: ComponentFixture<PlanEntitlementsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PlanEntitlementsComponent],
            providers: [
                {
                    provide: SubscriptionService,
                    useValue: {
                        getCurrent: () => of({ plan: 'premium' }),
                    },
                },
                {
                    provide: EditionService,
                    useValue: {
                        currentEntitlements: () => null,
                        loadEntitlements: () => of(null),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlanEntitlementsComponent);
        fixture.detectChanges();
    });

    it('renders the page title', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('h1')?.textContent).toContain('Plan & Entitlements');
    });
});
