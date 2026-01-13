import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CdkOverlayOrigin, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    Output,
    QueryList,
    EmbeddedViewRef,
    TemplateRef,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import { MbTooltipDirective } from '../tooltip/mb-tooltip.directive';

export type MbRoleSelectorRole = {
    id: string;
    name: string;
    key?: string;
    description?: string;
    category?: string;
    icon?: string;
};

type RoleGroup = {
    category: string;
    roles: MbRoleSelectorRole[];
};

@Component({
    selector: 'mb-role-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, OverlayModule, MbTooltipDirective],
    template: `
        <div class="mb-role-selector" #host [class.mb-role-selector--single]="!multiple">
            <label class="mb-role-selector__label" *ngIf="label">{{ label }}</label>
            <div
                #field
                cdkOverlayOrigin
                #origin="cdkOverlayOrigin"
                class="mb-role-selector__field"
                tabindex="0"
                role="combobox"
                [attr.aria-expanded]="open"
                [attr.aria-disabled]="disabled || readOnly"
                [class.mb-role-selector__field--open]="open"
                [class.mb-role-selector__field--disabled]="disabled"
                [class.mb-role-selector__field--readonly]="readOnly"
                (click)="handleFieldClick()"
                (keydown)="handleFieldKeydown($event)"
                (focusin)="fieldFocused = true"
                (focusout)="fieldFocused = false"
                (mouseenter)="prefetchRoles()"
            >
                <span class="mb-role-selector__field-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 3l8 3v6c0 4.4-3.2 8.5-8 10-4.8-1.5-8-5.6-8-10V6l8-3z" stroke="currentColor" stroke-width="1.6"/>
                        <path d="M9.4 12.2l2 2.2 3.6-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <div class="mb-role-selector__chips" [class.mb-role-selector__chips--empty]="!selectedRoles.length">
                    <ng-container *ngFor="let role of visibleSelectedRoles">
                        <span class="mb-role-chip">
                            <span class="mb-role-chip__icon" aria-hidden="true">
                                <ng-container [ngSwitch]="iconForRole(role)">
                                    <svg *ngSwitchCase="'shield'" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 3l8 3v6c0 4.4-3.2 8.5-8 10-4.8-1.5-8-5.6-8-10V6l8-3z" stroke="currentColor" stroke-width="1.6"/>
                                        <path d="M9.4 12.2l2 2.2 3.6-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <svg *ngSwitchCase="'briefcase'" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 6h6a2 2 0 0 1 2 2v2H7V8a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.6"/>
                                        <path d="M5 10h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.6"/>
                                    </svg>
                                    <svg *ngSwitchCase="'cap'" viewBox="0 0 24 24" fill="none">
                                        <path d="M4 9l8-4 8 4-8 4-8-4z" stroke="currentColor" stroke-width="1.6"/>
                                        <path d="M8 12v4c0 1.1 1.8 2 4 2s4-.9 4-2v-4" stroke="currentColor" stroke-width="1.6"/>
                                    </svg>
                                    <svg *ngSwitchCase="'card'" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/>
                                        <path d="M3 10h18" stroke="currentColor" stroke-width="1.6"/>
                                        <path d="M7 14h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                    </svg>
                                    <svg *ngSwitchCase="'users'" viewBox="0 0 24 24" fill="none">
                                        <circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.6"/>
                                        <circle cx="17" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6"/>
                                        <path d="M4 18c0-2.8 2.3-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                        <path d="M14.5 18c0-1.9 1.6-3.5 3.5-3.5S21.5 16.1 21.5 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                    </svg>
                                    <svg *ngSwitchCase="'clipboard'" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 4h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.6"/>
                                        <path d="M8 8h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                        <path d="M8 12h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                    </svg>
                                    <svg *ngSwitchCase="'eye'" viewBox="0 0 24 24" fill="none">
                                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" stroke="currentColor" stroke-width="1.6"/>
                                        <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.6"/>
                                    </svg>
                                    <svg *ngSwitchCase="'tag'" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 12l9-9h6l3 3v6l-9 9-9-9z" stroke="currentColor" stroke-width="1.6"/>
                                        <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
                                    </svg>
                                </ng-container>
                            </span>
                            <span class="mb-role-chip__label">{{ role.name }}</span>
                            <button
                                *ngIf="!disabled && !readOnly"
                                type="button"
                                class="mb-role-chip__remove"
                                (click)="removeRole(role, $event)"
                                aria-label="Remove role"
                            >
                                ×
                            </button>
                        </span>
                    </ng-container>
                    <button
                        *ngIf="hiddenSelectedRoles.length"
                        type="button"
                        class="mb-role-chip mb-role-chip--more"
                        [mbTooltip]="hiddenRolesTooltip"
                        (click)="$event.stopPropagation()"
                    >
                        +{{ hiddenSelectedRoles.length }} more
                    </button>
                    <span class="mb-role-selector__placeholder" *ngIf="!selectedRoles.length">{{ placeholder }}</span>
                </div>
                <span class="mb-role-selector__chevron" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            </div>

            <ng-template #overlayPanel>
                <div
                    #popoverPanel
                    class="mb-role-selector__popover"
                    (keydown)="handlePopoverKeydown($event)"
                    [style.width.px]="fieldWidth"
                >
                    <div class="mb-role-selector__search">
                        <span class="mb-role-selector__search-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"></circle>
                                <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
                            </svg>
                        </span>
                        <input
                            #searchInput
                            type="text"
                            class="mb-role-selector__search-input"
                            [placeholder]="'Search roles'"
                            [value]="searchValue"
                            [disabled]="disabled"
                            (input)="handleSearchInput($event)"
                        />
                    </div>

                    <div *ngIf="loading" class="mb-role-selector__loading">
                        <div class="mb-role-selector__skeleton" *ngFor="let _ of skeletonRows"></div>
                    </div>

                    <div *ngIf="errorMessage" class="mb-role-selector__error">
                        <div class="mb-role-selector__error-text">Couldn't load roles.</div>
                        <button type="button" class="mb-role-selector__error-action" (click)="loadRoles()">Retry</button>
                    </div>

                    <ng-container *ngIf="!loading && !errorMessage">
                        <div
                            *ngIf="showSelectedSection && selectedRoles.length"
                            class="mb-role-selector__section"
                        >
                            <div class="mb-role-selector__section-title">Selected</div>
                            <div class="mb-role-selector__list" role="listbox" [attr.aria-multiselectable]="multiple">
                                <button
                                    *ngFor="let role of selectedRoles"
                                    #roleOption
                                    type="button"
                                    class="mb-role-selector__option"
                                    [class.mb-role-selector__option--selected]="isSelected(role)"
                                    (click)="toggleRole(role)"
                                    role="option"
                                    [attr.aria-selected]="isSelected(role)"
                                >
                                    <span class="mb-role-selector__option-icon" aria-hidden="true">
                                        <ng-container [ngSwitch]="iconForRole(role)">
                                            <svg *ngSwitchCase="'shield'" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 3l8 3v6c0 4.4-3.2 8.5-8 10-4.8-1.5-8-5.6-8-10V6l8-3z" stroke="currentColor" stroke-width="1.6"/>
                                                <path d="M9.4 12.2l2 2.2 3.6-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            <svg *ngSwitchCase="'briefcase'" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 6h6a2 2 0 0 1 2 2v2H7V8a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.6"/>
                                                <path d="M5 10h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.6"/>
                                            </svg>
                                            <svg *ngSwitchCase="'cap'" viewBox="0 0 24 24" fill="none">
                                                <path d="M4 9l8-4 8 4-8 4-8-4z" stroke="currentColor" stroke-width="1.6"/>
                                                <path d="M8 12v4c0 1.1 1.8 2 4 2s4-.9 4-2v-4" stroke="currentColor" stroke-width="1.6"/>
                                            </svg>
                                            <svg *ngSwitchCase="'card'" viewBox="0 0 24 24" fill="none">
                                                <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/>
                                                <path d="M3 10h18" stroke="currentColor" stroke-width="1.6"/>
                                                <path d="M7 14h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                            </svg>
                                            <svg *ngSwitchCase="'users'" viewBox="0 0 24 24" fill="none">
                                                <circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.6"/>
                                                <circle cx="17" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6"/>
                                                <path d="M4 18c0-2.8 2.3-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                                <path d="M14.5 18c0-1.9 1.6-3.5 3.5-3.5S21.5 16.1 21.5 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                            </svg>
                                            <svg *ngSwitchCase="'clipboard'" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 4h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.6"/>
                                                <path d="M8 8h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                                <path d="M8 12h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                            </svg>
                                            <svg *ngSwitchCase="'eye'" viewBox="0 0 24 24" fill="none">
                                                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" stroke="currentColor" stroke-width="1.6"/>
                                                <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.6"/>
                                            </svg>
                                            <svg *ngSwitchCase="'tag'" viewBox="0 0 24 24" fill="none">
                                                <path d="M3 12l9-9h6l3 3v6l-9 9-9-9z" stroke="currentColor" stroke-width="1.6"/>
                                                <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
                                            </svg>
                                        </ng-container>
                                    </span>
                                    <span class="mb-role-selector__option-main">
                                        <span class="mb-role-selector__option-name">{{ role.name }}</span>
                                        <span class="mb-role-selector__option-desc" *ngIf="role.description">{{ role.description }}</span>
                                    </span>
                                    <span class="mb-role-selector__option-control" aria-hidden="true">
                                        <span
                                            class="mb-role-selector__checkbox"
                                            [class.mb-role-selector__checkbox--selected]="isSelected(role)"
                                            [class.mb-role-selector__checkbox--radio]="!multiple"
                                        ></span>
                                    </span>
                                </button>
                            </div>
                        </div>

                        <ng-container *ngIf="groupedRoles.length; else emptyState">
                            <div class="mb-role-selector__section" *ngFor="let group of groupedRoles">
                                <div class="mb-role-selector__section-title">{{ group.category }}</div>
                                <div class="mb-role-selector__list" role="listbox" [attr.aria-multiselectable]="multiple">
                                    <button
                                        *ngFor="let role of group.roles"
                                        #roleOption
                                        type="button"
                                        class="mb-role-selector__option"
                                        [class.mb-role-selector__option--selected]="isSelected(role)"
                                        (click)="toggleRole(role)"
                                        role="option"
                                        [attr.aria-selected]="isSelected(role)"
                                    >
                                        <span class="mb-role-selector__option-icon" aria-hidden="true">
                                            <ng-container [ngSwitch]="iconForRole(role)">
                                                <svg *ngSwitchCase="'shield'" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 3l8 3v6c0 4.4-3.2 8.5-8 10-4.8-1.5-8-5.6-8-10V6l8-3z" stroke="currentColor" stroke-width="1.6"/>
                                                    <path d="M9.4 12.2l2 2.2 3.6-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                                <svg *ngSwitchCase="'briefcase'" viewBox="0 0 24 24" fill="none">
                                                    <path d="M9 6h6a2 2 0 0 1 2 2v2H7V8a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.6"/>
                                                    <path d="M5 10h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.6"/>
                                                </svg>
                                                <svg *ngSwitchCase="'cap'" viewBox="0 0 24 24" fill="none">
                                                    <path d="M4 9l8-4 8 4-8 4-8-4z" stroke="currentColor" stroke-width="1.6"/>
                                                    <path d="M8 12v4c0 1.1 1.8 2 4 2s4-.9 4-2v-4" stroke="currentColor" stroke-width="1.6"/>
                                                </svg>
                                                <svg *ngSwitchCase="'card'" viewBox="0 0 24 24" fill="none">
                                                    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/>
                                                    <path d="M3 10h18" stroke="currentColor" stroke-width="1.6"/>
                                                    <path d="M7 14h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                                </svg>
                                                <svg *ngSwitchCase="'users'" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.6"/>
                                                    <circle cx="17" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6"/>
                                                    <path d="M4 18c0-2.8 2.3-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                                    <path d="M14.5 18c0-1.9 1.6-3.5 3.5-3.5S21.5 16.1 21.5 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                                </svg>
                                                <svg *ngSwitchCase="'clipboard'" viewBox="0 0 24 24" fill="none">
                                                    <path d="M9 4h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.6"/>
                                                    <path d="M8 8h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                                    <path d="M8 12h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                                </svg>
                                                <svg *ngSwitchCase="'eye'" viewBox="0 0 24 24" fill="none">
                                                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" stroke="currentColor" stroke-width="1.6"/>
                                                    <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.6"/>
                                                </svg>
                                                <svg *ngSwitchCase="'tag'" viewBox="0 0 24 24" fill="none">
                                                    <path d="M3 12l9-9h6l3 3v6l-9 9-9-9z" stroke="currentColor" stroke-width="1.6"/>
                                                    <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
                                                </svg>
                                            </ng-container>
                                        </span>
                                        <span class="mb-role-selector__option-main">
                                            <span class="mb-role-selector__option-name">
                                                <ng-container *ngFor="let part of highlightParts(role.name)">
                                                    <span [class.mb-role-selector__match]="part.match">{{ part.text }}</span>
                                                </ng-container>
                                            </span>
                                            <span class="mb-role-selector__option-desc" *ngIf="role.description">{{ role.description }}</span>
                                        </span>
                                        <span class="mb-role-selector__option-control" aria-hidden="true">
                                            <span
                                                class="mb-role-selector__checkbox"
                                                [class.mb-role-selector__checkbox--selected]="isSelected(role)"
                                                [class.mb-role-selector__checkbox--radio]="!multiple"
                                            ></span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </ng-container>
                        <ng-template #emptyState>
                            <div class="mb-role-selector__empty">
                                {{ debouncedSearch ? "No roles match '" + debouncedSearch + "'" : 'No roles available' }}
                            </div>
                        </ng-template>
                    </ng-container>

                    <div class="mb-role-selector__footer" *ngIf="!readOnly">
                        <button type="button" class="mb-role-selector__footer-button" (click)="clearSelection()">Clear</button>
                        <button type="button" class="mb-role-selector__footer-button mb-role-selector__footer-button--primary" (click)="close()">
                            Done
                        </button>
                    </div>
                </div>
            </ng-template>
        </div>
    `,
    styleUrls: ['./mb-role-selector.component.scss']
})
export class MbRoleSelectorComponent implements OnDestroy {
    private readonly http = inject(HttpClient);
    private readonly overlay = inject(Overlay);
    private readonly viewContainerRef = inject(ViewContainerRef);

    @Input() value: string[] = [];
    @Input() label = 'Roles';
    @Input() placeholder = 'Select roles…';
    @Input() multiple = true;
    @Input() disabled = false;
    @Input() readOnly = false;
    @Input() schoolId?: string;
    @Input() excludeRoleKeys: string[] = [];
    @Input() maxVisibleChips = 2;
    @Input() showSelectedSection = true;

    @Output() valueChange = new EventEmitter<string[]>();
    @Output() change = new EventEmitter<{ ids: string[]; roles?: MbRoleSelectorRole[] }>();

    @ViewChild('host') host?: ElementRef<HTMLElement>;
    @ViewChild('field') field?: ElementRef<HTMLElement>;
    @ViewChild('origin') origin?: CdkOverlayOrigin;
    @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
    @ViewChildren('roleOption') roleOptions?: QueryList<ElementRef<HTMLButtonElement>>;
    @ViewChild('popoverPanel') popoverPanel?: ElementRef<HTMLElement>;
    @ViewChild('overlayPanel') overlayPanel?: TemplateRef<unknown>;

    open = false;
    loading = false;
    errorMessage = '';
    searchValue = '';
    debouncedSearch = '';
    fieldFocused = false;

    roles: MbRoleSelectorRole[] = [];
    fieldWidth = 360;
    private static cachedRoles: MbRoleSelectorRole[] | null = null;
    scrollStrategy = this.overlay.scrollStrategies.reposition();
    positions: ConnectedPosition[] = [
        {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
            offsetY: 8
        },
        {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
            offsetY: -8
        }
    ];
    private searchTimer?: number;
    private rolesRequest?: Subscription;
    private activeIndex = -1;
    private ignoreOutsideClick = false;
    readonly skeletonRows = Array.from({ length: 5 });
    private overlayElement?: HTMLElement;
    private overlayView?: EmbeddedViewRef<unknown>;

    @HostListener('document:click', ['$event'])
    handleDocumentClick(event: MouseEvent): void {
        if (!this.open || this.ignoreOutsideClick) return;
        const target = event.target as Node | null;
        if (!target) return;
        if (this.host?.nativeElement.contains(target)) return;
        if (this.popoverPanel?.nativeElement.contains(target)) return;
        if (this.overlayElement?.contains(target)) return;
        this.close();
    }

    @HostListener('window:resize')
    handleWindowResize(): void {
        if (!this.open || !this.overlayElement) return;
        this.updateFieldWidth();
        this.positionOverlay();
    }

    @HostListener('window:scroll')
    handleWindowScroll(): void {
        if (!this.open || !this.overlayElement) return;
        this.positionOverlay();
    }

    ngOnDestroy(): void {
        if (this.searchTimer) {
            window.clearTimeout(this.searchTimer);
        }
        this.rolesRequest?.unsubscribe();
        this.detachOverlay();
    }

    get selectedRoles(): MbRoleSelectorRole[] {
        return this.value.map(value => this.findRoleByValue(value) ?? { id: value, name: value });
    }

    get visibleSelectedRoles(): MbRoleSelectorRole[] {
        return this.selectedRoles.slice(0, this.maxVisibleChips);
    }

    get hiddenSelectedRoles(): MbRoleSelectorRole[] {
        return this.selectedRoles.slice(this.maxVisibleChips);
    }

    get hiddenRolesTooltip(): string {
        return this.hiddenSelectedRoles.map(role => role.name).join(', ');
    }

    get groupedRoles(): RoleGroup[] {
        const roles = this.filteredRoles;
        if (!roles.length) return [];
        const groups: RoleGroup[] = [];
        roles.forEach(role => {
            const category = role.category?.trim() || 'General';
            let group = groups.find(item => item.category === category);
            if (!group) {
                group = { category, roles: [] };
                groups.push(group);
            }
            group.roles.push(role);
        });
        return groups;
    }

    get filteredRoles(): MbRoleSelectorRole[] {
        const excluded = new Set(this.excludeRoleKeys.map(key => key.toLowerCase()));
        const search = this.debouncedSearch.trim().toLowerCase();
        const selectedValues = [...this.value];
        const roles = this.roles.filter(role => {
            if (role.key && excluded.has(role.key.toLowerCase())) return false;
            if (!search) return true;
            const haystack = [role.name, role.key, role.description].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(search);
        });

        const sorted = roles.sort((a, b) => {
            const catA = (a.category || 'General').toLowerCase();
            const catB = (b.category || 'General').toLowerCase();
            if (catA !== catB) return catA.localeCompare(catB);
            return a.name.localeCompare(b.name);
        });

        if (this.showSelectedSection && this.selectedRoles.length) {
            return sorted.filter(role => !selectedValues.some(value => this.matchesValue(role, value)));
        }
        return sorted;
    }

    private get roleMap(): Map<string, MbRoleSelectorRole> {
        return new Map(this.roles.map(role => [role.id, role]));
    }

    handleFieldClick(): void {
        if (this.disabled || this.readOnly) return;
        if (!this.open) {
            this.toggleOpen();
            return;
        }
        this.focusSearchInput();
    }

    handleFieldKeydown(event: KeyboardEvent): void {
        if (this.disabled || this.readOnly) return;
        if (event.key === 'Enter' || event.key === 'ArrowDown') {
            event.preventDefault();
            this.openDropdown();
            return;
        }
        if (event.key === 'Escape') {
            this.close();
            return;
        }
        if (event.key === 'Backspace' && !this.searchValue) {
            this.removeLastRole();
        }
    }

    handlePopoverKeydown(event: KeyboardEvent): void {
        if (!this.open) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            this.selectActive();
        }
        if (event.key === 'Backspace' && !this.searchValue) {
            this.removeLastRole();
        }
    }

    handleSearchInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchValue = target.value;
        if (this.searchTimer) {
            window.clearTimeout(this.searchTimer);
        }
        this.searchTimer = window.setTimeout(() => {
            this.debouncedSearch = this.searchValue;
            this.resetActiveIndex();
        }, 150);
    }

    toggleRole(role: MbRoleSelectorRole): void {
        if (this.disabled || this.readOnly) return;
        if (this.multiple) {
            const selected = this.value.filter(value => !this.matchesValue(role, value));
            if (this.isSelected(role)) {
                this.emitSelection(selected);
                return;
            }
            this.emitSelection([...selected, role.id]);
            return;
        }
        const next = role.id === this.value[0] ? [role.id] : [role.id];
        this.emitSelection(next);
        this.close();
    }

    removeRole(role: MbRoleSelectorRole, event: MouseEvent): void {
        event.stopPropagation();
        if (this.disabled || this.readOnly) return;
        const next = this.value.filter(value => !this.matchesValue(role, value));
        this.emitSelection(next);
    }

    clearSelection(): void {
        if (this.disabled || this.readOnly) return;
        this.emitSelection([]);
        this.searchValue = '';
        this.debouncedSearch = '';
    }

    iconForRole(role: MbRoleSelectorRole): string {
        if (role.icon) {
            const icon = role.icon.toLowerCase();
            if (icon.includes('shield')) return 'shield';
            if (icon.includes('briefcase')) return 'briefcase';
            if (icon.includes('cap')) return 'cap';
            if (icon.includes('credit') || icon.includes('card')) return 'card';
            if (icon.includes('user') || icon.includes('people')) return 'users';
            if (icon.includes('clipboard')) return 'clipboard';
            if (icon.includes('eye')) return 'eye';
            if (icon.includes('tag')) return 'tag';
        }
        const label = `${role.key || ''} ${role.name || ''}`.toLowerCase();
        if (/(super|admin|owner)/.test(label)) return 'shield';
        if (/(manager|lead)/.test(label)) return 'briefcase';
        if (/(teacher|instructor)/.test(label)) return 'cap';
        if (/(finance|billing)/.test(label)) return 'card';
        if (/(hr|payroll)/.test(label)) return 'users';
        if (/(registrar|admission)/.test(label)) return 'clipboard';
        if (/(viewer|read|audit)/.test(label)) return 'eye';
        if (/(staff|general)/.test(label)) return 'users';
        return 'tag';
    }

    highlightParts(name: string): Array<{ text: string; match: boolean }> {
        const query = this.debouncedSearch.trim();
        if (!query) {
            return [{ text: name, match: false }];
        }
        const lowerName = name.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerName.indexOf(lowerQuery);
        if (index === -1) {
            return [{ text: name, match: false }];
        }
        const before = name.slice(0, index);
        const match = name.slice(index, index + query.length);
        const after = name.slice(index + query.length);
        return [
            { text: before, match: false },
            { text: match, match: true },
            { text: after, match: false }
        ];
    }

    isSelected(role: MbRoleSelectorRole): boolean {
        return this.value.some(value => this.matchesValue(role, value));
    }

    prefetchRoles(): void {
        if (this.roles.length || this.loading || this.errorMessage) return;
        this.loadRoles();
    }

    loadRoles(): void {
        if (this.loading) return;
        if (MbRoleSelectorComponent.cachedRoles) {
            this.roles = [...MbRoleSelectorComponent.cachedRoles];
            this.resetActiveIndex();
            return;
        }
        this.loading = true;
        this.errorMessage = '';
        let params = new HttpParams();
        if (this.schoolId) {
            params = params.set('schoolId', this.schoolId);
        }
        this.rolesRequest?.unsubscribe();
        this.rolesRequest = this.http.get<unknown>('/api/roles', { params }).subscribe({
            next: response => {
                const roles = this.normalizeRoles(response);
                this.roles = roles;
                MbRoleSelectorComponent.cachedRoles = roles;
                this.loading = false;
                this.resetActiveIndex();
            },
            error: () => {
                this.loading = false;
                this.errorMessage = 'error';
            }
        });
    }

    openDropdown(): void {
        if (this.open || this.disabled || this.readOnly) return;
        this.toggleOpen();
    }

    toggleOpen(): void {
        if (this.open) {
            this.close();
            return;
        }
        this.open = true;
        this.updateFieldWidth();
        this.attachOverlay();
        this.loadRoles();
        this.resetActiveIndex();
        this.ignoreOutsideClick = true;
        this.focusSearchInput();
        setTimeout(() => {
            this.ignoreOutsideClick = false;
        });
    }

    close(): void {
        this.open = false;
        this.activeIndex = -1;
        this.detachOverlay();
    }

    private emitSelection(ids: string[]): void {
        this.value = ids;
        const roles = ids.map(id => this.findRoleByValue(id)).filter(Boolean) as MbRoleSelectorRole[];
        this.valueChange.emit(ids);
        this.change.emit({ ids, roles });
    }

    private matchesValue(role: MbRoleSelectorRole, value: string): boolean {
        return role.id === value || role.name === value || role.key === value;
    }

    private findRoleByValue(value: string): MbRoleSelectorRole | undefined {
        return this.roles.find(role => this.matchesValue(role, value));
    }

    private updateFieldWidth(): void {
        const width = this.field?.nativeElement.getBoundingClientRect().width ?? 0;
        this.fieldWidth = Math.min(480, Math.round(width || 360));
        if (this.overlayElement) {
            this.positionOverlay();
        }
    }

    private normalizeRoles(response: unknown): MbRoleSelectorRole[] {
        if (Array.isArray(response)) {
            return response as MbRoleSelectorRole[];
        }
        if (response && typeof response === 'object' && 'items' in response) {
            return (response as { items: MbRoleSelectorRole[] }).items ?? [];
        }
        return [];
    }

    private resetActiveIndex(): void {
        this.activeIndex = -1;
    }

    private attachOverlay(): void {
        if (this.overlayElement || !this.overlayPanel || !this.field) return;
        const element = document.createElement('div');
        element.className = 'mb-role-selector__overlay mb-popover-panel mb-popover-panel--above-modal';
        element.style.position = 'fixed';
        element.style.zIndex = '1201';
        element.style.pointerEvents = 'auto';
        document.body.appendChild(element);

        this.overlayView = this.viewContainerRef.createEmbeddedView(this.overlayPanel);
        this.overlayView.rootNodes.forEach(node => element.appendChild(node));
        this.overlayElement = element;
        this.positionOverlay();
    }

    private positionOverlay(): void {
        if (!this.overlayElement || !this.field) return;
        const rect = this.field.nativeElement.getBoundingClientRect();
        const estimatedHeight = 420;
        const gutter = 8;
        let top = rect.bottom + gutter;
        if (top + estimatedHeight > window.innerHeight) {
            top = rect.top - gutter - estimatedHeight;
        }
        top = Math.max(gutter, top);
        let left = rect.left;
        if (left + this.fieldWidth > window.innerWidth) {
            left = Math.max(gutter, window.innerWidth - this.fieldWidth - gutter);
        }
        this.overlayElement.style.top = `${Math.round(top)}px`;
        this.overlayElement.style.left = `${Math.round(left)}px`;
        this.overlayElement.style.width = `${this.fieldWidth}px`;
    }

    private detachOverlay(): void {
        if (!this.overlayElement) return;
        this.overlayView?.destroy();
        this.overlayView = undefined;
        this.overlayElement.remove();
        this.overlayElement = undefined;
    }

    private moveActive(delta: number): void {
        const options = this.roleOptions?.toArray() ?? [];
        if (!options.length) return;
        const nextIndex = this.activeIndex < 0 ? 0 : this.activeIndex + delta;
        const next = Math.min(Math.max(nextIndex, 0), options.length - 1);
        this.activeIndex = next;
        this.focusActive();
    }

    private selectActive(): void {
        const options = this.roleOptions?.toArray() ?? [];
        if (!options.length || this.activeIndex < 0) return;
        options[this.activeIndex].nativeElement.click();
    }

    private focusActive(): void {
        const options = this.roleOptions?.toArray() ?? [];
        if (!options.length || this.activeIndex < 0) return;
        setTimeout(() => {
            options[this.activeIndex]?.nativeElement.focus();
        });
    }

    private removeLastRole(): void {
        if (!this.value.length) return;
        const next = this.value.slice(0, -1);
        this.emitSelection(next);
    }

    private focusSearchInput(): void {
        setTimeout(() => {
            this.searchInput?.nativeElement.focus();
        });
    }
}
