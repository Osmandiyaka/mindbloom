import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MbButtonComponent, MbFormFieldComponent, MbInputComponent } from '@mindbloom/ui';

export interface AddressValue {
    street?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
}

@Component({
    selector: 'app-address',
    standalone: true,
    imports: [CommonModule, MbFormFieldComponent, MbInputComponent, MbButtonComponent],
    template: `
        <div class="address-block">
            <div class="address-block__header" *ngIf="showTitle || showCopy">
                <div class="address-block__title" *ngIf="showTitle">{{ title }}</div>
                <mb-button *ngIf="showCopy" variant="tertiary" (click)="copyFromTenant.emit()">
                    {{ copyLabel }}
                </mb-button>
            </div>
            <div class="address-block__grid">
                <div class="address-block__field address-block__field--full">
                    <mb-form-field label="Street address" [controlId]="controlPrefix + '-street'">
                        <mb-input
                            [id]="controlPrefix + '-street'"
                            [value]="value.street || ''"
                            (valueChange)="updateField('street', $event)"
                        ></mb-input>
                    </mb-form-field>
                </div>

                <div class="address-block__field address-block__field--full">
                    <mb-form-field label="Address line 2 (optional)" [controlId]="controlPrefix + '-line2'">
                        <mb-input
                            [id]="controlPrefix + '-line2'"
                            [value]="value.line2 || ''"
                            (valueChange)="updateField('line2', $event)"
                        ></mb-input>
                    </mb-form-field>
                </div>

                <div class="address-block__field">
                    <mb-form-field label="City" [controlId]="controlPrefix + '-city'">
                        <mb-input
                            [id]="controlPrefix + '-city'"
                            [value]="value.city || ''"
                            (valueChange)="updateField('city', $event)"
                        ></mb-input>
                    </mb-form-field>
                </div>

                <div class="address-block__field">
                    <mb-form-field label="State / Province" [controlId]="controlPrefix + '-state'">
                        <mb-input
                            [id]="controlPrefix + '-state'"
                            [value]="value.state || ''"
                            (valueChange)="updateField('state', $event)"
                        ></mb-input>
                    </mb-form-field>
                </div>

                <div class="address-block__field">
                    <mb-form-field label="Postal code" [controlId]="controlPrefix + '-postal'">
                        <mb-input
                            [id]="controlPrefix + '-postal'"
                            [value]="value.postalCode || ''"
                            (valueChange)="updateField('postalCode', $event)"
                        ></mb-input>
                    </mb-form-field>
                </div>
            </div>
        </div>
    `,
    styleUrls: ['./address.component.scss'],
})
export class AddressComponent {
    @Input() value: AddressValue = {};
    @Input() showCopy = false;
    @Input() copyLabel = 'Copy from organization';
    @Input() title = 'Address';
    @Input() showTitle = true;
    @Input() controlPrefix = 'address';

    @Output() valueChange = new EventEmitter<AddressValue>();
    @Output() copyFromTenant = new EventEmitter<void>();

    updateField(field: keyof AddressValue, value: string): void {
        this.valueChange.emit({ ...(this.value || {}), [field]: value });
    }
}
