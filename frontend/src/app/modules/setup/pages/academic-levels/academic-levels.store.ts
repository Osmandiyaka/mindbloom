import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../../core/ui/toast/toast.service';
import {
    AcademicLevel,
    AcademicLevelImpact,
    AcademicLevelTemplateKey,
    AcademicLevelTemplateOption,
    AcademicLevelsApiService,
    CreateAcademicLevelRequest,
    UpdateAcademicLevelRequest
} from '../../../../core/services/academic-levels-api.service';
import { ApiError } from '../../../../core/http/api-client.service';

type AutosaveStatusValue = {
    status: 'idle' | 'saving' | 'saved' | 'error';
    message?: string;
};

@Injectable()
export class AcademicLevelsStore {
    private readonly api = inject(AcademicLevelsApiService);
    private readonly toast = inject(ToastService);

    templates = signal<AcademicLevelTemplateOption[]>(this.api.getTemplateOptions());
    selectedTemplateKey = signal<AcademicLevelTemplateKey>(this.templates()[0]?.key ?? 'k12');
    levels = signal<AcademicLevel[]>([]);
    isLoading = signal(false);
    errorMessage = signal<string | null>(null);
    isApplyingTemplate = signal(false);
    isAddingLevel = signal(false);
    reorderMode = signal(false);
    reorderSaving = signal(false);
    showArchived = signal(false);
    autosaveStatus = signal<Record<string, AutosaveStatusValue>>({});

    private pendingUpdateTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private pendingUpdatePatches = new Map<string, UpdateAcademicLevelRequest>();

    readonly currentTemplate = computed(() =>
        this.templates().find(template => template.key === this.selectedTemplateKey()) || this.templates()[0]
    );

    readonly sortedLevels = computed(() => this.sortLevels(this.levels()));
    readonly activeLevels = computed(() => this.sortedLevels().filter(level => level.status === 'active'));
    readonly archivedLevels = computed(() => this.sortedLevels().filter(level => level.status === 'archived'));
    readonly displayLevels = computed(() => this.showArchived() ? this.sortedLevels() : this.activeLevels());
    readonly hasArchived = computed(() => this.archivedLevels().length > 0);
    readonly validationWarnings = computed(() => this.buildValidationWarnings(this.levels()));
    readonly autosaveIndicator = computed(() => this.buildAutosaveIndicator(this.autosaveStatus()));

    async loadLevels(): Promise<void> {
        if (this.isLoading()) return;
        this.isLoading.set(true);
        this.errorMessage.set(null);
        try {
            const response = await firstValueFrom(this.api.getLevels());
            const levels = response.data ?? [];
            this.levels.set(this.sortLevels(levels));
            if (response.meta?.templateKey) {
                this.selectedTemplateKey.set(response.meta.templateKey);
            }
        } catch (error) {
            const message = this.extractErrorMessage(error, 'Unable to load academic levels.');
            this.errorMessage.set(message);
            this.toast.error(message);
        } finally {
            this.isLoading.set(false);
        }
    }

    async applyTemplate(templateKey: AcademicLevelTemplateKey): Promise<void> {
        if (this.isApplyingTemplate()) return;
        this.isApplyingTemplate.set(true);
        try {
            const response = await firstValueFrom(this.api.applyTemplate(templateKey));
            const levels = response.data?.levels ?? [];
            this.levels.set(this.sortLevels(levels));
            this.selectedTemplateKey.set(templateKey);
            const title = this.templates().find(template => template.key === templateKey)?.title;
            if (title) {
                this.toast.success(`Template “${title}” applied.`);
            }
        } catch (error) {
            const message = this.extractErrorMessage(error, 'Unable to apply template.');
            this.toast.error(message);
        } finally {
            this.isApplyingTemplate.set(false);
        }
    }

    async createLevel(payload: CreateAcademicLevelRequest): Promise<AcademicLevel | null> {
        if (this.isAddingLevel()) return null;
        this.isAddingLevel.set(true);
        try {
            const response = await firstValueFrom(this.api.createLevel(payload));
            const level = response.data;
            if (level) {
                this.levels.update(items => this.sortLevels([...items, level]));
                this.toast.success(`Level “${level.name}” added.`);
                return level;
            }
        } catch (error) {
            const message = this.extractErrorMessage(error, 'Unable to add level.');
            this.toast.error(message);
        } finally {
            this.isAddingLevel.set(false);
        }
        return null;
    }

    queueUpdate(levelId: string, patch: UpdateAcademicLevelRequest): void {
        const currentPatch = this.pendingUpdatePatches.get(levelId) ?? {};
        const nextPatch = { ...currentPatch, ...patch };
        this.pendingUpdatePatches.set(levelId, nextPatch);

        this.levels.update(items => items.map(level =>
            level.id === levelId ? { ...level, ...patch } : level
        ));

        this.autosaveStatus.update(state => ({
            ...state,
            [levelId]: { status: 'saving' }
        }));

        const previousTimer = this.pendingUpdateTimers.get(levelId);
        if (previousTimer) {
            clearTimeout(previousTimer);
        }
        const timer = setTimeout(() => void this.flushPendingUpdate(levelId), 500);
        this.pendingUpdateTimers.set(levelId, timer);
    }

    async archiveLevel(levelId: string, confirmationText?: string): Promise<void> {
        try {
            await firstValueFrom(this.api.archiveLevel(levelId, confirmationText));
            this.toast.success('Level archived.');
            await this.loadLevels();
        } catch (error) {
            const message = this.extractErrorMessage(error, 'Unable to archive level.');
            this.toast.error(message);
        }
    }

    async restoreLevel(levelId: string): Promise<void> {
        try {
            await firstValueFrom(this.api.restoreLevel(levelId));
            this.toast.success('Level restored.');
            await this.loadLevels();
        } catch (error) {
            const message = this.extractErrorMessage(error, 'Unable to restore level.');
            this.toast.error(message);
        }
    }

    async deleteLevel(levelId: string, confirmationText?: string): Promise<void> {
        try {
            await firstValueFrom(this.api.deleteLevel(levelId, confirmationText));
            this.toast.success('Level deleted.');
            await this.loadLevels();
        } catch (error) {
            const message = this.extractErrorMessage(error, 'Unable to delete level.');
            this.toast.error(message);
        }
    }

    async getDeleteImpact(levelId: string): Promise<AcademicLevelImpact | null> {
        try {
            const response = await firstValueFrom(this.api.getDeleteImpact(levelId));
            return response.data ?? null;
        } catch (error) {
            const message = this.extractErrorMessage(error, 'Unable to check impact.');
            this.toast.error(message);
            return null;
        }
    }

    moveLevel(levelId: string, direction: 'up' | 'down'): void {
        if (this.reorderSaving()) return;
        const list = this.sortedLevels();
        const index = list.findIndex(level => level.id === levelId);
        if (index === -1) return;
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= list.length) return;
        const reordered = [...list];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(nextIndex, 0, moved);
        const normalized = reordered.map((level, idx) => ({ ...level, sortOrder: idx + 1 }));
        this.levels.set(normalized);
        void this.persistReorder(normalized);
    }

    toggleReorderMode(): void {
        this.reorderMode.update(state => !state);
    }

    setShowArchived(value: boolean): void {
        this.showArchived.set(value);
    }

    private async persistReorder(sorted: AcademicLevel[]): Promise<void> {
        this.reorderSaving.set(true);
        try {
            const updates = sorted.map(level => ({ id: level.id, sortOrder: level.sortOrder }));
            await firstValueFrom(this.api.reorderLevels({ items: updates }));
            this.toast.success('Level order saved.');
        } catch (error) {
            const message = this.extractErrorMessage(error, 'Unable to save order.');
            this.toast.error(message);
            await this.loadLevels();
        } finally {
            this.reorderSaving.set(false);
        }
    }

    private async flushPendingUpdate(levelId: string): Promise<void> {
        const patch = this.pendingUpdatePatches.get(levelId);
        if (!patch) return;
        this.pendingUpdatePatches.delete(levelId);
        this.pendingUpdateTimers.delete(levelId);
        try {
            const response = await firstValueFrom(this.api.updateLevel(levelId, patch));
            const updated = response.data;
            if (updated) {
                this.levels.update(items => this.replaceLevel(items, updated));
            }
            this.autosaveStatus.update(state => ({
                ...state,
                [levelId]: { status: 'saved' }
            }));
        } catch (error) {
            const message = this.extractErrorMessage(error, 'Unable to save level changes.');
            this.autosaveStatus.update(state => ({
                ...state,
                [levelId]: { status: 'error', message }
            }));
            this.toast.error(message);
            await this.loadLevels();
        }
    }

    private sortLevels(levels: AcademicLevel[]): AcademicLevel[] {
        return [...levels].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    private replaceLevel(items: AcademicLevel[], updated: AcademicLevel): AcademicLevel[] {
        return this.sortLevels(items.map(level => level.id === updated.id ? { ...level, ...updated } : level));
    }

    private buildValidationWarnings(levels: AcademicLevel[]): Record<string, { name?: string; code?: string }> {
        const nameCounts = new Map<string, number>();
        const codeCounts = new Map<string, number>();

        levels.forEach(level => {
            const name = level.name.trim().toLowerCase();
            if (name) {
                nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
            }
            const code = level.code?.trim().toLowerCase();
            if (code) {
                codeCounts.set(code, (codeCounts.get(code) ?? 0) + 1);
            }
        });

        const warnings: Record<string, { name?: string; code?: string }> = {};
        levels.forEach(level => {
            const entry: { name?: string; code?: string } = {};
            const nameKey = level.name.trim().toLowerCase();
            if (!level.name.trim()) {
                entry.name = 'Name is required.';
            } else if (nameKey && (nameCounts.get(nameKey) ?? 0) > 1) {
                entry.name = 'Duplicate name.';
            }
            const codeKey = level.code?.trim().toLowerCase();
            if (codeKey && (codeCounts.get(codeKey) ?? 0) > 1) {
                entry.code = 'Duplicate code.';
            }
            if (Object.keys(entry).length) {
                warnings[level.id] = entry;
            }
        });
        return warnings;
    }

    private buildAutosaveIndicator(statusMap: Record<string, AutosaveStatusValue>): { text: string; tone: 'muted' | 'success' | 'danger' } | null {
        const statuses = Object.values(statusMap);
        if (statuses.some(status => status.status === 'saving')) {
            return { text: 'Saving…', tone: 'muted' };
        }
        if (statuses.some(status => status.status === 'error')) {
            return { text: 'Some changes failed to save.', tone: 'danger' };
        }
        if (statuses.some(status => status.status === 'saved')) {
            return { text: 'All changes saved.', tone: 'success' };
        }
        return null;
    }

    private extractErrorMessage(error: unknown, fallback: string): string {
        if (this.isApiError(error)) {
            return error.message || fallback;
        }
        return fallback;
    }

    private isApiError(error: unknown): error is ApiError {
        return Boolean(error && typeof error === 'object' && 'message' in error);
    }
}
