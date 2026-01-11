import { Component, ContentChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MbCardActionsDirective, MbCardFooterDirective, MbCardHeaderDirective } from './mb-card.directives';

@Component({
    selector: 'mb-card',
    standalone: true,
    imports: [CommonModule, MbCardHeaderDirective, MbCardFooterDirective, MbCardActionsDirective],
    template: `
        <section class="mb-card">
            <header class="mb-card__header" *ngIf="title || subtitle || headerSlot || actionsSlot">
                <div>
                    <h3 class="mb-card__title" *ngIf="title">{{ title }}</h3>
                    <p class="mb-card__subtitle" *ngIf="subtitle">{{ subtitle }}</p>
                </div>
                <div class="mb-card__actions">
                    <ng-content select="[mbCardActions]"></ng-content>
                </div>
                <ng-content select="[mbCardHeader]"></ng-content>
            </header>
            <div class="mb-card__body">
                <ng-content></ng-content>
            </div>
            <footer class="mb-card__footer" *ngIf="footerSlot">
                <ng-content select="[mbCardFooter]"></ng-content>
            </footer>
        </section>
    `,
    styleUrls: ['./mb-card.component.scss']
})
export class MbCardComponent {
    @Input() title?: string;
    @Input() subtitle?: string;

    @ContentChild(MbCardHeaderDirective) headerSlot?: MbCardHeaderDirective;
    @ContentChild(MbCardFooterDirective) footerSlot?: MbCardFooterDirective;
    @ContentChild(MbCardActionsDirective) actionsSlot?: MbCardActionsDirective;
}
