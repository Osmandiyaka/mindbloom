import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import {
    MbButtonComponent,
    MbCheckboxComponent,
    MbModalComponent,
    MbModalFooterDirective,
    MbPopoverComponent
} from '@mindbloom/ui';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import { TenantWorkspaceSetupFacade } from '../tenant-workspace-setup/tenant-workspace-setup.facade';
import { DestructiveConfirmModalComponent } from '../../../../shared/components/destructive-confirm-modal/destructive-confirm-modal.component';
import { AcademicLevelsStore } from './academic-levels.store';
import { AcademicLevel, AcademicLevelImpact, AcademicLevelTemplateOption } from '../../../../core/services/academic-levels-api.service';
import { AddAcademicLevelModalComponent } from './add-academic-level-modal.component';
import { AcademicLevelsTableComponent } from './academic-levels-table.component';

@Component({
    selector: 'app-academic-levels-page',
    standalone: true,
    imports: [
        CommonModule,
        OverlayModule,
        MbButtonComponent,
        MbPopoverComponent,
        MbCheckboxComponent,
        MbModalComponent,
        MbModalFooterDirective,
        DestructiveConfirmModalComponent,
        AddAcademicLevelModalComponent,
        AcademicLevelsTableComponent
    ],
    providers: [AcademicLevelsStore],
    templateUrl: './academic-levels.page.html',
    styleUrls: ['./academic-levels.page.scss']
})
export class AcademicLevelsPageComponent implements OnInit {
    readonly store = inject(AcademicLevelsStore);
    private readonly facade = inject(TenantWorkspaceSetupFacade);
    private readonly toast = inject(ToastService);

    columnsMenuOpen = signal(false);
    overflowMenuOpen = signal(false);
    pendingTemplate = signal<AcademicLevelTemplateOption | null>(null);
    templateConfirmOpen = signal(false);
    addModalOpen = signal(false);
    destructiveModalOpen = signal(false);
    destructiveAction = signal<'archive' | 'delete' | null>(null);
    destructiveTarget = signal<AcademicLevel | null>(null);
    destructiveImpact = signal<AcademicLevelImpact | null>(null);
    requireTypedConfirmation = signal(false);
    destructiveProcessing = signal(false);
    levelFocusId = signal<string | null>(null);

    columnsConfig = signal({ code: true, group: true });

    readonly displayLevels = this.store.displayLevels;
    readonly isLoading = this.store.isLoading;
    readonly errorMessage = this.store.errorMessage;
    readonly templates = this.store.templates;
    readonly currentTemplate = this.store.currentTemplate;
    readonly autosaveIndicator = this.store.autosaveIndicator;
    readonly validationWarnings = this.store.validationWarnings;
    readonly showArchived = this.store.showArchived;

    readonly groupColumnVisible = computed(() =>
        this.columnsConfig().group && this.currentTemplate().supportsGrouping
    );
    readonly codeColumnVisible = computed(() => this.columnsConfig().code);

    readonly destructiveImpactItems = computed(() => {
        const impact = this.destructiveImpact();
        const items: string[] = [];
        if (impact?.classesCount) {
            items.push(`${impact.classesCount} class${impact.classesCount === 1 ? '' : 'es'}`);
        }
        if (impact?.studentsCount) {
            items.push(`${impact.studentsCount} student${impact.studentsCount === 1 ? '' : 's'}`);
        }
        return items;
    });

    ngOnInit(): void {
        this.store.loadLevels();
        effect(() => {
            this.facade.levelsTemplate.set(this.store.selectedTemplateKey());
            this.facade.levels.set(this.store.levels().map(level => level.name));
        });
    }

    handleTemplateSelect(template: AcademicLevelTemplateOption): void {
        if (template.key === this.store.selectedTemplateKey()) {
            return;
        }
        if (this.store.levels().length === 0) {
            void this.store.applyTemplate(template.key);
            return;
        }
        this.pendingTemplate.set(template);
        this.templateConfirmOpen.set(true);
    }

    confirmTemplateChange(): void {
        const template = this.pendingTemplate();
        if (!template) return;
        this.templateConfirmOpen.set(false);
        this.pendingTemplate.set(null);
        void this.store.applyTemplate(template.key);
    }

    cancelTemplateChange(): void {
        this.templateConfirmOpen.set(false);
        this.pendingTemplate.set(null);
    }

    openAddModal(): void {
        this.addModalOpen.set(true);
    }

    handleAddLevel(payload: { name: string; code?: string; group?: string }): void {
        void this.store.createLevel(payload).then(level => {
            this.addModalOpen.set(false);
            if (level && level.id) {
                this.levelFocusId.set(level.id);
                setTimeout(() => this.levelFocusId.set(null));
            }
        });
    }

    handleRowInlineEdit(event: { id: string; field: 'name' | 'code' | 'group'; value: string }): void {
        this.store.queueUpdate(event.id, { [event.field]: event.value });
    }

    handleRowAction(action: 'archive' | 'restore' | 'delete', level: AcademicLevel): void {
        if (action === 'restore') {
            void this.store.restoreLevel(level.id);
            return;
        }
        this.destructiveAction.set(action);
        this.destructiveTarget.set(level);
        this.destructiveImpact.set(null);
        this.requireTypedConfirmation.set(false);
        this.destructiveModalOpen.set(true);
        void this.store.getDeleteImpact(level.id).then(impact => {
            this.destructiveImpact.set(impact);
            this.requireTypedConfirmation.set(Boolean(impact?.classesCount || impact?.studentsCount));
        });
    }

    handleDestructiveConfirm(confirmationText: string): void {
        const level = this.destructiveTarget();
        const action = this.destructiveAction();
        if (!level || !action) return;
        const requiresTyping = this.requireTypedConfirmation();
        const text = requiresTyping ? confirmationText : undefined;
        const handler = action === 'archive'
            ? this.store.archiveLevel(level.id, text)
            : this.store.deleteLevel(level.id, text);
        this.destructiveProcessing.set(true);
        handler.finally(() => {
            this.destructiveModalOpen.set(false);
            this.destructiveAction.set(null);
            this.destructiveTarget.set(null);
            this.destructiveProcessing.set(false);
        });
    }

    handleDestructiveClosed(): void {
        this.destructiveModalOpen.set(false);
        this.destructiveAction.set(null);
        this.destructiveTarget.set(null);
        this.destructiveImpact.set(null);
        this.requireTypedConfirmation.set(false);
        this.destructiveProcessing.set(false);
    }

    toggleColumn(key: 'code' | 'group'): void {
        this.columnsConfig.update(state => ({ ...state, [key]: !state[key] }));
    }

    toggleReorderMode(): void {
        this.store.toggleReorderMode();
    }

    applyResetTemplate(): void {
        void this.store.applyTemplate(this.store.selectedTemplateKey());
    }

    showImportToast(): void {
        this.toast.info('Import presets will be available soon.');
    }

    showExportToast(): void {
        this.toast.info('Exporting levels is coming soon.');
    }
}
