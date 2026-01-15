import { Component, Input, Output, EventEmitter, signal, effect, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { UiButtonComponent } from '../../../../shared/ui/buttons/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/ui/forms/ui-checkbox.component';
import { Permission, PermissionAction } from '../../../../core/models/role.model';

@Component({
    selector: 'app-permission-tree',
    standalone: true,
    imports: [CommonModule, SearchInputComponent, UiButtonComponent, UiCheckboxComponent],
    templateUrl: './permission-tree.component.html',
    styleUrls: ['./permission-tree.component.scss']
})
export class PermissionTreeComponent {
    @Input() set permissionTree(value: Permission[]) {
        this._permissionTree.set(value);
    }
    @Input() set selectedPermissions(value: string[]) {
        this._selectedPermissions.set(new Set(value));
    }
    @Input() set density(value: 'comfortable' | 'compact') {
        this.densityMode.set(value || 'comfortable');
    }
    @Output() densityChange = new EventEmitter<'comfortable' | 'compact'>();
    @Input() readOnly = false;
    @Output() permissionsChange = new EventEmitter<string[]>();

    private _permissionTree = signal<Permission[]>([]);
    private _selectedPermissions = signal<Set<string>>(new Set());
    search = signal('');
    viewSelectedOnly = signal(false);
    viewMode = signal<'simple' | 'detailed'>('simple');
    densityMode = signal<'comfortable' | 'compact'>('comfortable');

    @ViewChildren('treeRow', { read: ElementRef })
    private rowElements!: QueryList<ElementRef<HTMLElement>>;

    constructor() {
        effect(() => {
            const term = this.search().trim().toLowerCase();
            if (!term) {
                return;
            }
            const matchedIds = this.collectMatchingModuleIds(term, this.permissionTreeValue);
            if (!matchedIds.size) {
                return;
            }
            const expanded = this.expandedNodes();
            let changed = false;
            const next = new Set(expanded);
            matchedIds.forEach((id) => {
                if (!next.has(id)) {
                    next.add(id);
                    changed = true;
                }
            });
            if (changed) {
                this.expandedNodes.set(next);
            }
        });
    }

    get permissionTreeValue() {
        return this._permissionTree();
    }

    get selectedCount(): number {
        return this._selectedPermissions().size;
    }

    get filteredTree(): Permission[] {
        const term = this.search().trim().toLowerCase();
        if (!term) {
            return this.permissionTreeValue;
        }
        return this.permissionTreeValue
            .map((module) => this.filterTreeByTerm(term, module))
            .filter((module): module is Permission => !!module);
    }

    get displayedTree(): Permission[] {
        if (!this.viewSelectedOnly()) {
            return this.filteredTree;
        }
        return this.filteredTree
            .map((module) => this.filterSelected(module))
            .filter((module): module is Permission => !!module);
    }

    get searchSummary(): { results: number; categories: number } | null {
        const term = this.search().trim().toLowerCase();
        if (!term) {
            return null;
        }
        return {
            results: this.countLeafPermissions(this.displayedTree),
            categories: this.displayedTree.length,
        };
    }

    get selectedModuleChips(): Array<{ id: string; name: string; count: number }> {
        return this.permissionTreeValue
            .map((module) => ({
                id: module.id,
                name: module.displayName || module.resource,
                count: this.moduleCoverage(module).enabled,
            }))
            .filter((chip) => chip.count > 0);
    }

    get visibleModuleChips(): Array<{ id: string; name: string; count: number }> {
        return this.selectedModuleChips.slice(0, 4);
    }

    get overflowModuleCount(): number {
        return Math.max(0, this.selectedModuleChips.length - this.visibleModuleChips.length);
    }

    expandedNodes = signal<Set<string>>(new Set());

    toggleNode(permissionId: string) {
        const expanded = this.expandedNodes();
        if (expanded.has(permissionId)) {
            expanded.delete(permissionId);
        } else {
            expanded.add(permissionId);
        }
        this.expandedNodes.set(new Set(expanded));
    }

    isExpanded(permissionId: string): boolean {
        return this.expandedNodes().has(permissionId);
    }

    expandAll(): void {
        this.expandedNodes.set(new Set(this.displayedTree.map((module) => module.id)));
    }

    collapseAll(): void {
        this.expandedNodes.set(new Set());
    }

    togglePermission(permission: Permission) {
        if (this.readOnly) {
            return;
        }

        const selected = new Set(this._selectedPermissions());
        const hasChildren = this.hasChildren(permission);
        const sourcePermission = hasChildren
            ? this.findPermissionById(permission.id, this.permissionTreeValue) || permission
            : permission;
        const targetIds = hasChildren ? this.collectDescendantIds(sourcePermission) : [permission.id];

        const allSelected = targetIds.every((id) => selected.has(id));
        targetIds.forEach((id) => {
            if (allSelected) {
                selected.delete(id);
            } else {
                selected.add(id);
            }
        });

        this.emitSelection(selected);
    }

    selectVisibleResults(): void {
        if (this.readOnly) {
            return;
        }
        const visibleIds = new Set<string>();
        this.displayedTree.forEach((module) => {
            this.collectLeafIds(module).forEach((id) => visibleIds.add(id));
        });
        const selected = new Set(this._selectedPermissions());
        visibleIds.forEach((id) => selected.add(id));
        this.emitSelection(selected);
    }

    clearAllSelections(): void {
        if (this.readOnly) {
            return;
        }
        this.emitSelection(new Set());
    }

    setDensity(mode: 'comfortable' | 'compact'): void {
        this.densityMode.set(mode);
        this.densityChange.emit(mode);
    }

    isSelected(permissionId: string): boolean {
        return this._selectedPermissions().has(permissionId);
    }

    isIndeterminate(permission: Permission): boolean {
        if (!this.hasChildren(permission)) {
            return false;
        }
        const sourcePermission = this.findPermissionById(permission.id, this.permissionTreeValue) || permission;
        const targetIds = this.collectDescendantIds(sourcePermission);
        const selectedCount = targetIds.filter((id) => this._selectedPermissions().has(id)).length;
        return selectedCount > 0 && selectedCount < targetIds.length;
    }

    hasChildren(permission: Permission): boolean {
        return !!(permission.children && permission.children.length > 0);
    }

    moduleCoverage(permission: Permission): { enabled: number; total: number } {
        const sourcePermission = this.findPermissionById(permission.id, this.permissionTreeValue) || permission;
        if (!this.hasChildren(sourcePermission)) {
            return { enabled: this.isSelected(sourcePermission.id) ? 1 : 0, total: 1 };
        }
        const ids = this.collectDescendantIds(sourcePermission);
        const enabled = ids.filter((id) => this.isSelected(id)).length;
        return { enabled, total: ids.length };
    }

    moduleSelectionState(permission: Permission): { checked: boolean; indeterminate: boolean } {
        if (!this.hasChildren(permission)) {
            return { checked: this.isSelected(permission.id), indeterminate: false };
        }
        const coverage = this.moduleCoverage(permission);
        return {
            checked: coverage.enabled === coverage.total && coverage.total > 0,
            indeterminate: coverage.enabled > 0 && coverage.enabled < coverage.total,
        };
    }

    moduleStatus(permission: Permission): { label: 'All' | 'Partial' | 'None'; count: string; state: 'all' | 'partial' | 'none' } {
        const coverage = this.moduleCoverage(permission);
        if (coverage.total === 0 || coverage.enabled === 0) {
            return { label: 'None', count: `0/${coverage.total}`, state: 'none' };
        }
        if (coverage.enabled === coverage.total) {
            return { label: 'All', count: `${coverage.total}`, state: 'all' };
        }
        return { label: 'Partial', count: `${coverage.enabled}/${coverage.total}`, state: 'partial' };
    }

    permissionCount(permission: Permission): number {
        if (!this.hasChildren(permission)) {
            return 1;
        }
        return this.moduleCoverage(permission).total;
    }

    iconKey(permission: Permission): string {
        const rawIcon = (permission.icon || '').toLowerCase();
        const known = new Set(['users', 'book', 'calendar', 'shield', 'settings', 'chart', 'folder']);
        if (known.has(rawIcon)) {
            return rawIcon;
        }
        const keySource = `${permission.resource} ${permission.displayName}`.toLowerCase();
        if (/(student|staff|teacher|user|member|people|parent)/.test(keySource)) {
            return 'users';
        }
        if (/(course|class|subject|library|lesson|curriculum)/.test(keySource)) {
            return 'book';
        }
        if (/(calendar|schedule|attendance|event|timetable)/.test(keySource)) {
            return 'calendar';
        }
        if (/(role|permission|security|admin|access)/.test(keySource)) {
            return 'shield';
        }
        if (/(setting|config|system|setup)/.test(keySource)) {
            return 'settings';
        }
        if (/(report|analytics|insight|dashboard)/.test(keySource)) {
            return 'chart';
        }
        return 'folder';
    }

    highlightText(text: string | undefined | null): string {
        const value = text || '';
        const term = this.search().trim();
        if (!term) {
            return value;
        }
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'ig');
        return value.replace(regex, '<mark class="permission-highlight">$1</mark>');
    }

    handleRowKeydown(event: KeyboardEvent, permission: Permission, isCategory: boolean): void {
        if (event.currentTarget !== event.target && event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return;
        }
        const key = event.key;
        if (key === 'ArrowDown' || key === 'ArrowUp') {
            event.preventDefault();
            this.moveFocus(key === 'ArrowDown' ? 1 : -1, event.currentTarget as HTMLElement);
            return;
        }
        if (key === 'Enter' && isCategory && this.hasChildren(permission)) {
            event.preventDefault();
            this.toggleNode(permission.id);
            return;
        }
        if (key === ' ' || key === 'Spacebar') {
            event.preventDefault();
            this.togglePermission(permission);
        }
    }

    displayActions(actions: PermissionAction[]): PermissionAction[] {
        return actions.filter((action) => action !== PermissionAction.MANAGE);
    }

    isSensitive(permission: Permission): boolean {
        const resource = (permission.resource || '').toLowerCase();
        const sensitivePrefixes = ['finance', 'accounting', 'payroll', 'hr', 'system', 'admin', 'roles', 'security'];
        if (sensitivePrefixes.some((prefix) => resource.startsWith(prefix))) {
            return true;
        }
        return (permission.actions || []).includes(PermissionAction.MANAGE);
    }

    rowsForGroup(group: Permission): Array<{ permission: Permission; depth: number }> {
        return this.collectRows(group.children || [], 0, []);
    }

    clearModuleSelection(moduleId: string): void {
        if (this.readOnly) {
            return;
        }
        const module = this.findPermissionById(moduleId, this.permissionTreeValue);
        if (!module) return;
        const selected = new Set(this._selectedPermissions());
        this.collectDescendantIds(module).forEach((id) => selected.delete(id));
        this.emitSelection(selected);
    }

    private collectDescendantIds(permission: Permission): string[] {
        const ids: string[] = [];
        const walk = (node: Permission) => {
            (node.children || []).forEach((child) => {
                if (child.children?.length) {
                    walk(child);
                } else {
                    ids.push(child.id);
                }
            });
        };
        walk(permission);
        return ids;
    }

    private findPermissionById(permissionId: string, tree: Permission[]): Permission | null {
        for (const node of tree) {
            if (node.id === permissionId) {
                return node;
            }
            if (node.children?.length) {
                const found = this.findPermissionById(permissionId, node.children);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }

    private collectLeafIds(permission: Permission): string[] {
        if (!permission.children?.length) {
            return [permission.id];
        }
        const ids: string[] = [];
        const walk = (node: Permission) => {
            if (!node.children?.length) {
                ids.push(node.id);
                return;
            }
            node.children.forEach((child) => walk(child));
        };
        walk(permission);
        return ids;
    }

    private collectMatchingModuleIds(term: string, tree: Permission[]): Set<string> {
        const matches = new Set<string>();
        tree.forEach((module) => {
            const moduleText = `${module.displayName} ${module.description || ''}`.toLowerCase();
            const childMatches = this.nodeMatches(term, module);
            if (moduleText.includes(term) || childMatches) {
                matches.add(module.id);
            }
        });
        return matches;
    }

    private nodeMatches(term: string, permission: Permission): boolean {
        const children = permission.children || [];
        return children.some((child) => {
            const text = `${child.displayName} ${child.description || ''}`.toLowerCase();
            if (text.includes(term)) {
                return true;
            }
            return this.nodeMatches(term, child);
        });
    }

    private filterTreeByTerm(term: string, permission: Permission): Permission | null {
        const matchesSelf =
            permission.displayName.toLowerCase().includes(term) ||
            (permission.description || '').toLowerCase().includes(term);
        if (matchesSelf) {
            return permission;
        }
        const children = (permission.children || [])
            .map((child) => this.filterTreeByTerm(term, child))
            .filter((child): child is Permission => !!child);
        if (children.length) {
            return { ...permission, children };
        }
        return null;
    }

    private countLeafPermissions(tree: Permission[]): number {
        return tree.reduce((total, module) => total + this.collectLeafIds(module).length, 0);
    }

    private moveFocus(delta: number, currentTarget: HTMLElement): void {
        const rows = this.rowElements?.toArray() || [];
        const currentIndex = rows.findIndex((row) => row.nativeElement === currentTarget);
        if (currentIndex === -1) {
            return;
        }
        const nextIndex = Math.min(rows.length - 1, Math.max(0, currentIndex + delta));
        rows[nextIndex]?.nativeElement.focus();
    }

    private emitSelection(selected: Set<string>): void {
        const next = Array.from(selected).sort();
        this._selectedPermissions.set(new Set(next));
        this.permissionsChange.emit(next);
    }

    private collectRows(
        nodes: Permission[],
        depth: number,
        rows: Array<{ permission: Permission; depth: number }>
    ): Array<{ permission: Permission; depth: number }> {
        nodes.forEach((node) => {
            rows.push({ permission: node, depth });
            if (node.children?.length) {
                this.collectRows(node.children, depth + 1, rows);
            }
        });
        return rows;
    }

    private filterSelected(permission: Permission): Permission | null {
        const children = (permission.children || [])
            .map((child) => this.filterSelected(child))
            .filter((child): child is Permission => !!child);
        const isLeafSelected = !permission.children?.length && this.isSelected(permission.id);
        const hasSelectedChild = children.length > 0;
        if (isLeafSelected || hasSelectedChild) {
            return { ...permission, children };
        }
        return null;
    }
}
