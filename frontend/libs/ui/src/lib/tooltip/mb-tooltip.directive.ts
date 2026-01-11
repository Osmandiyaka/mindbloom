import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MbTooltipOverlayComponent } from './mb-tooltip.component';

@Directive({
    selector: '[mbTooltip]',
    standalone: true
})
export class MbTooltipDirective implements OnInit, OnDestroy {
    private readonly overlay = inject(Overlay);
    private readonly positionBuilder = inject(OverlayPositionBuilder);
    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private overlayRef?: OverlayRef;
    private tooltipId = `mb-tooltip-${Math.random().toString(36).slice(2, 9)}`;

    @Input('mbTooltip') text = '';

    ngOnInit(): void {
        const element = this.elementRef.nativeElement;
        element.addEventListener('mouseenter', this.show);
        element.addEventListener('mouseleave', this.hide);
        element.addEventListener('focus', this.show);
        element.addEventListener('blur', this.hide);
    }

    ngOnDestroy(): void {
        this.elementRef.nativeElement.removeEventListener('mouseenter', this.show);
        this.elementRef.nativeElement.removeEventListener('mouseleave', this.hide);
        this.elementRef.nativeElement.removeEventListener('focus', this.show);
        this.elementRef.nativeElement.removeEventListener('blur', this.hide);
        this.destroy();
    }

    private show = () => {
        if (!this.text) {
            return;
        }
        if (!this.overlayRef) {
            this.overlayRef = this.overlay.create({
                positionStrategy: this.positionBuilder
                    .flexibleConnectedTo(this.elementRef)
                    .withPositions(this.getPositions())
                    .withFlexibleDimensions(false)
                    .withPush(false),
                panelClass: 'mb-tooltip-panel',
                scrollStrategy: this.overlay.scrollStrategies.reposition()
            });
        }
        if (!this.overlayRef.hasAttached()) {
            const tooltipPortal = new ComponentPortal(MbTooltipOverlayComponent);
            const tooltipRef = this.overlayRef.attach(tooltipPortal);
            tooltipRef.instance.text = this.text;
            tooltipRef.instance.id = this.tooltipId;
            this.elementRef.nativeElement.setAttribute('aria-describedby', this.tooltipId);
        }
    };

    private hide = () => {
        if (this.overlayRef?.hasAttached()) {
            this.overlayRef.detach();
        }
        this.elementRef.nativeElement.removeAttribute('aria-describedby');
    };

    private destroy(): void {
        this.overlayRef?.dispose();
        this.overlayRef = undefined;
    }

    private getPositions(): ConnectedPosition[] {
        return [
            {
                originX: 'center',
                originY: 'top',
                overlayX: 'center',
                overlayY: 'bottom',
                offsetY: -8
            },
            {
                originX: 'center',
                originY: 'bottom',
                overlayX: 'center',
                overlayY: 'top',
                offsetY: 8
            }
        ];
    }
}
