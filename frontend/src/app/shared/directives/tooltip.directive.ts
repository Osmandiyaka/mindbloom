import { Directive, Input, ElementRef, HostListener, Renderer2, OnDestroy } from '@angular/core';

@Directive({
    selector: '[appTooltip]',
    standalone: true
})
export class TooltipDirective implements OnDestroy {
    @Input('appTooltip') tooltipText = '';
    @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

    private tooltipElement: HTMLElement | null = null;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2
    ) { }

    @HostListener('mouseenter')
    onMouseEnter(): void {
        if (!this.tooltipText) return;
        this.showTooltip();
    }

    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.hideTooltip();
    }

    private showTooltip(): void {
        // Create tooltip element
        this.tooltipElement = this.renderer.createElement('div');
        this.renderer.addClass(this.tooltipElement, 'app-tooltip');
        this.renderer.addClass(this.tooltipElement, `tooltip-${this.tooltipPosition}`);

        // Set text
        const text = this.renderer.createText(this.tooltipText);
        this.renderer.appendChild(this.tooltipElement, text);

        // Append to body
        this.renderer.appendChild(document.body, this.tooltipElement);

        // Position tooltip
        this.positionTooltip();

        // Trigger animation
        setTimeout(() => {
            if (this.tooltipElement) {
                this.renderer.addClass(this.tooltipElement, 'tooltip-visible');
            }
        }, 10);
    }

    private hideTooltip(): void {
        if (this.tooltipElement) {
            this.renderer.removeClass(this.tooltipElement, 'tooltip-visible');
            setTimeout(() => {
                if (this.tooltipElement) {
                    this.renderer.removeChild(document.body, this.tooltipElement);
                    this.tooltipElement = null;
                }
            }, 150);
        }
    }

    private positionTooltip(): void {
        if (!this.tooltipElement) return;

        const hostRect = this.el.nativeElement.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();

        let top = 0;
        let left = 0;

        switch (this.tooltipPosition) {
            case 'top':
                top = hostRect.top - tooltipRect.height - 8;
                left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = hostRect.bottom + 8;
                left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
                left = hostRect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
                left = hostRect.right + 8;
                break;
        }

        this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
        this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
    }

    ngOnDestroy(): void {
        this.hideTooltip();
    }
}
