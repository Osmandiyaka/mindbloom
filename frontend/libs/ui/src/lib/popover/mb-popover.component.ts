import { CommonModule } from '@angular/common';
import { Component, ElementRef, EmbeddedViewRef, EventEmitter, HostListener, Input, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';

@Component({
    selector: 'mb-popover',
    standalone: true,
    imports: [CommonModule],
    template: `
        <ng-template #popoverTemplate>
            <div class="mb-popover" [class.mb-popover--plain]="variant === 'plain'" role="dialog">
                <ng-content></ng-content>
            </div>
        </ng-template>
        <div
            *ngIf="debug && open"
            class="mb-popover-debug"
            [style.top.px]="debugRect?.bottom"
            [style.left.px]="debugRect?.left"
        >
            Debug popover
        </div>
    `,
    styleUrls: ['./mb-popover.component.scss']
})
export class MbPopoverComponent {
    private overlayElement?: HTMLElement;
    private overlayView?: EmbeddedViewRef<unknown>;
    private backdropElement?: HTMLElement;

    private isOpen = false;

    @Input()
    set open(value: boolean) {
        this.isOpen = value;
        if (value) {
            this.attachOverlay();
        } else {
            this.detachOverlay();
        }
    }
    get open(): boolean {
        return this.isOpen;
    }

    @Input({ required: true })
    set origin(
        value:
            | CdkOverlayOrigin
            | ElementRef<HTMLElement>
            | HTMLElement
            | { elementRef?: ElementRef<HTMLElement> }
            | { nativeElement?: HTMLElement }
            | { root?: { nativeElement?: HTMLElement } }
            | null
            | undefined
    ) {
        this.rawOrigin = value;
    }

    @Input() hasBackdrop = false;
    @Input() variant: 'default' | 'plain' = 'default';
    @Input() panelClass: string | string[] = 'mb-popover-panel';
    @Input() debug = false;
    @Output() closed = new EventEmitter<void>();

    @ViewChild('popoverTemplate') popoverTemplate?: TemplateRef<unknown>;

    private rawOrigin:
        | CdkOverlayOrigin
        | ElementRef<HTMLElement>
        | HTMLElement
        | { elementRef?: ElementRef<HTMLElement> }
        | { nativeElement?: HTMLElement }
        | { root?: { nativeElement?: HTMLElement } }
        | null
        | undefined;

    debugRect: DOMRect | null = null;

    constructor(private readonly viewContainerRef: ViewContainerRef, private readonly host: ElementRef<HTMLElement>) {}

    close(): void {
        this.detachOverlay();
        this.closed.emit();
    }

    @HostListener('window:resize')
    handleResize(): void {
        if (!this.open) return;
        this.positionOverlay();
    }

    @HostListener('window:scroll')
    handleScroll(): void {
        if (!this.open) return;
        this.positionOverlay();
    }

    private attachOverlay(): void {
        if (!this.popoverTemplate) return;
        const originElement = this.resolveOriginElement();
        if (!originElement) return;

        this.detachOverlay();

        if (this.hasBackdrop) {
            const backdrop = document.createElement('div');
            backdrop.className = 'mb-popover-backdrop';
            backdrop.style.position = 'fixed';
            backdrop.style.inset = '0';
            backdrop.style.zIndex = '1200';
            backdrop.style.background = 'transparent';
            backdrop.addEventListener('click', () => this.close());
            document.body.appendChild(backdrop);
            this.backdropElement = backdrop;
        }

        const overlay = document.createElement('div');
        const panelClasses = Array.isArray(this.panelClass) ? this.panelClass.join(' ') : this.panelClass;
        overlay.className = panelClasses;
        overlay.style.position = 'fixed';
        overlay.style.zIndex = '1201';
        overlay.style.pointerEvents = 'auto';
        overlay.style.width = 'max-content';
        overlay.style.maxWidth = 'calc(100vw - 16px)';

        this.overlayView = this.viewContainerRef.createEmbeddedView(this.popoverTemplate);
        this.overlayView.rootNodes.forEach(node => overlay.appendChild(node));
        document.body.appendChild(overlay);
        this.overlayElement = overlay;

        this.positionOverlay();

        if (this.debug) {
            const rect = originElement.getBoundingClientRect();
            this.debugRect = rect;
            const overlayRect = overlay.getBoundingClientRect();
            const styles = window.getComputedStyle(overlay);
            // eslint-disable-next-line no-console
            console.debug('[mb-popover] attach', {
                overlayRect,
                originRect: rect,
                panelClass: this.panelClass,
                styles: {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    zIndex: styles.zIndex,
                    pointerEvents: styles.pointerEvents,
                    transform: styles.transform,
                    top: styles.top,
                    left: styles.left,
                    width: styles.width
                }
            });
        }
    }

    private positionOverlay(): void {
        if (!this.overlayElement) return;
        const originElement = this.resolveOriginElement();
        if (!originElement) return;

        const originRect = originElement.getBoundingClientRect();
        const overlayRect = this.overlayElement.getBoundingClientRect();
        const gutter = 8;
        let top = originRect.bottom + gutter;
        if (top + overlayRect.height > window.innerHeight - gutter) {
            top = originRect.top - overlayRect.height - gutter;
        }
        top = Math.max(gutter, top);
        let left = originRect.left;
        if (left + overlayRect.width > window.innerWidth - gutter) {
            left = window.innerWidth - overlayRect.width - gutter;
        }
        left = Math.max(gutter, left);
        this.overlayElement.style.top = `${Math.round(top)}px`;
        this.overlayElement.style.left = `${Math.round(left)}px`;
    }

    private detachOverlay(): void {
        if (this.overlayView) {
            this.overlayView.destroy();
            this.overlayView = undefined;
        }
        if (this.overlayElement) {
            this.overlayElement.remove();
            this.overlayElement = undefined;
        }
        if (this.backdropElement) {
            this.backdropElement.remove();
            this.backdropElement = undefined;
        }
    }

    private resolveOriginElement(): HTMLElement | null {
        const direct = this.extractElement(this.rawOrigin);
        if (direct && this.isUsableElement(direct)) {
            return direct;
        }
        const sibling = this.host.nativeElement.previousElementSibling;
        if (sibling instanceof HTMLElement && this.isUsableElement(sibling)) {
            return sibling;
        }
        const hostElement = this.host.nativeElement;
        return this.isUsableElement(hostElement) ? hostElement : null;
    }

    private extractElement(
        value: CdkOverlayOrigin | ElementRef<HTMLElement> | HTMLElement | { elementRef?: ElementRef<HTMLElement> } | { nativeElement?: HTMLElement } | { root?: { nativeElement?: HTMLElement } } | null | undefined
    ): HTMLElement | null {
        if (!value) return null;
        if (value instanceof CdkOverlayOrigin) {
            return value.elementRef.nativeElement;
        }
        if (value instanceof ElementRef) {
            return value.nativeElement;
        }
        if (value instanceof HTMLElement) {
            return value;
        }
        const maybeElementRef = (value as { elementRef?: ElementRef<HTMLElement> }).elementRef;
        if (maybeElementRef instanceof ElementRef) {
            return maybeElementRef.nativeElement;
        }
        const maybeNative = (value as { nativeElement?: HTMLElement }).nativeElement;
        if (maybeNative instanceof HTMLElement) {
            return maybeNative;
        }
        const maybeRoot = (value as { root?: { nativeElement?: HTMLElement } }).root?.nativeElement;
        if (maybeRoot instanceof HTMLElement) {
            return maybeRoot;
        }
        return null;
    }

    private isUsableElement(element: HTMLElement): boolean {
        const rect = element.getBoundingClientRect();
        return element.isConnected && (rect.width > 0 || rect.height > 0);
    }
}
