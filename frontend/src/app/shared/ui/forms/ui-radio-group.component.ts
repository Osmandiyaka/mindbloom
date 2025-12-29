import { CommonModule } from '@angular/common';
import {
    AfterContentInit,
    Component,
    ContentChildren,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    QueryList,
    SimpleChanges,
    Output
} from '@angular/core';
import { Subscription } from 'rxjs';
import { UiRadioComponent } from './ui-radio.component';

@Component({
    selector: 'ui-radio-group',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="ui-radio-group" [class.ui-radio-group--horizontal]="layout === 'horizontal'">
      <ng-content></ng-content>
    </div>
  `,
    styles: [`
    :host { display: block; }
    .ui-radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .ui-radio-group--horizontal {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }
  `]
})
export class UiRadioGroupComponent implements AfterContentInit, OnChanges, OnDestroy {
    private static nextId = 0;
    private readonly fallbackName = `ui-radio-group-${UiRadioGroupComponent.nextId++}`;
    private subscriptions: Subscription[] = [];
    private radiosChangeSub?: Subscription;

    @Input() name = '';
    @Input() layout: 'vertical' | 'horizontal' = 'vertical';
    @Input() value: string | number | null = null;
    @Output() valueChange = new EventEmitter<string | number | null>();

    @ContentChildren(UiRadioComponent) radios!: QueryList<UiRadioComponent>;

    ngAfterContentInit() {
        this.wireRadios();
        this.radiosChangeSub = this.radios.changes.subscribe(() => this.wireRadios());
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['value'] || changes['name']) {
            this.updateRadios();
        }
    }

    ngOnDestroy() {
        this.teardown();
    }

    private wireRadios() {
        this.teardown();
        if (!this.radios) return;

        this.radios.forEach(radio => {
            radio.name = radio.name || this.name || this.fallbackName;
            radio.checked = radio.value === this.value;
            const sub = radio.change.subscribe(val => {
                this.value = val;
                this.updateRadios();
                this.valueChange.emit(val);
            });
            this.subscriptions.push(sub);
        });
    }

    private updateRadios() {
        if (!this.radios) return;
        this.radios.forEach(radio => {
            radio.name = radio.name || this.name || this.fallbackName;
            radio.checked = radio.value === this.value;
        });
    }

    private teardown() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions = [];
        if (this.radiosChangeSub) {
            this.radiosChangeSub.unsubscribe();
            this.radiosChangeSub = undefined;
        }
    }
}
