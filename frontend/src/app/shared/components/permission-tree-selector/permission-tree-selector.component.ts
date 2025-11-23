import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Permission, PermissionNode } from '../../../core/models/role.model';

@Component({
    selector: 'app-permission-tree-selector',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="permission-tree-selector">
      <div class="search-box">
        <input 
          type="text" 
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          placeholder="🔍 Search permissions..."
          class="search-input"
        />
      </div>

      <div class="tree-actions">
        <button type="button" class="btn-link" (click)="expandAll()">Expand All</button>
        <button type="button" class="btn-link" (click)="collapseAll()">Collapse All</button>
        <button type="button" class="btn-link" (click)="selectAll()">Select All</button>
        <button type="button" class="btn-link" (click)="clearAll()">Clear All</button>
      </div>

      <div class="permission-tree">
        @if (filteredTree().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">🔍</span>
            <p>No permissions found</p>
          </div>
        } @else {
          @for (permission of filteredTree(); track permission.id) {
            <div class="tree-node" [class.has-children]="permission.children && permission.children.length > 0">
              <div class="node-content" [style.padding-left.px]="getNodeDepth(permission) * 20">
                @if (permission.children && permission.children.length > 0) {
                  <button 
                    type="button"
                    class="expand-btn" 
                    (click)="toggleExpand(permission)"
                  >
                    {{ permission.expanded ? '▼' : '▶' }}
                  </button>
                } @else {
                  <span class="expand-spacer"></span>
                }

                <input 
                  type="checkbox" 
                  [checked]="permission.selected"
                  [indeterminate]="permission.indeterminate"
                  (change)="toggleSelection(permission)"
                  class="node-checkbox"
                />

                <span class="node-icon">{{ permission.icon || '📄' }}</span>
                
                <div class="node-label">
                  <span class="node-name">{{ permission.displayName }}</span>
                  @if (permission.description) {
                    <span class="node-description">{{ permission.description }}</span>
                  }
                </div>

                <div class="node-meta">
                  <span class="scope-badge" [attr.data-scope]="permission.scope">
                    {{ permission.scope }}
                  </span>
                  @if (permission.actions && permission.actions.length > 0) {
                    <span class="actions-badge">
                      {{ permission.actions.join(', ') }}
                    </span>
                  }
                </div>
              </div>

              @if (permission.expanded && permission.children) {
                @for (child of permission.children; track child.id) {
                  <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child }"></ng-container>
                }
              }
            </div>
          }
        }
      </div>

      <div class="selected-count">
        {{ selectedCount() }} permission(s) selected
      </div>
    </div>

    <ng-template #nodeTemplate let-node>
      <div class="tree-node" [class.has-children]="node.children && node.children.length > 0">
        <div class="node-content" [style.padding-left.px]="getNodeDepth(node) * 20">
          @if (node.children && node.children.length > 0) {
            <button 
              type="button"
              class="expand-btn" 
              (click)="toggleExpand(node)"
            >
              {{ node.expanded ? '▼' : '▶' }}
            </button>
          } @else {
            <span class="expand-spacer"></span>
          }

          <input 
            type="checkbox" 
            [checked]="node.selected"
            [indeterminate]="node.indeterminate"
            (change)="toggleSelection(node)"
            class="node-checkbox"
          />

          <span class="node-icon">{{ node.icon || '📄' }}</span>
          
          <div class="node-label">
            <span class="node-name">{{ node.displayName }}</span>
            @if (node.description) {
              <span class="node-description">{{ node.description }}</span>
            }
          </div>

          <div class="node-meta">
            <span class="scope-badge" [attr.data-scope]="node.scope">
              {{ node.scope }}
            </span>
            @if (node.actions && node.actions.length > 0) {
              <span class="actions-badge">
                {{ node.actions.join(', ') }}
              </span>
            }
          </div>
        </div>

        @if (node.expanded && node.children) {
          @for (child of node.children; track child.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child }"></ng-container>
          }
        }
      </div>
    </ng-template>
  `,
    styles: [`
    .permission-tree-selector {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 600px;
    }

    .search-box {
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
      padding-bottom: 0.5rem;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .tree-actions {
      display: flex;
      gap: 1rem;
      padding: 0.5rem;
      background: #F9FAFB;
      border-radius: 6px;
    }

    .btn-link {
      background: none;
      border: none;
      color: #3B82F6;
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.25rem 0.5rem;
      transition: color 0.2s;
    }

    .btn-link:hover {
      color: #2563EB;
      text-decoration: underline;
    }

    .permission-tree {
      flex: 1;
      overflow-y: auto;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 0.5rem;
    }

    .tree-node {
      margin: 0.125rem 0;
    }

    .node-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .node-content:hover {
      background: #F9FAFB;
    }

    .expand-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      font-size: 0.75rem;
      color: #6B7280;
      width: 20px;
      text-align: center;
    }

    .expand-spacer {
      width: 20px;
      display: inline-block;
    }

    .node-checkbox {
      cursor: pointer;
      width: 16px;
      height: 16px;
    }

    .node-icon {
      font-size: 1.25rem;
    }

    .node-label {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .node-name {
      font-weight: 500;
      color: #111827;
      font-size: 0.875rem;
    }

    .node-description {
      font-size: 0.75rem;
      color: #6B7280;
    }

    .node-meta {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .scope-badge {
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .scope-badge[data-scope="own"] {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .scope-badge[data-scope="department"] {
      background: #FEF3C7;
      color: #92400E;
    }

    .scope-badge[data-scope="all"] {
      background: #D1FAE5;
      color: #065F46;
    }

    .actions-badge {
      padding: 0.125rem 0.5rem;
      background: #F3F4F6;
      border-radius: 4px;
      font-size: 0.75rem;
      color: #6B7280;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #9CA3AF;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .selected-count {
      padding: 0.75rem;
      background: #F9FAFB;
      border-radius: 6px;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6B7280;
    }
  `]
})
export class PermissionTreeSelectorComponent {
    // Inputs
    permissions = input.required<Permission[]>();
    selectedPermissionIds = input<string[]>([]);

    // Outputs
    selectionChange = output<string[]>();

    // State
    searchQuery = '';
    treeNodes = signal<PermissionNode[]>([]);

    // Computed
    filteredTree = computed(() => {
        const query = this.searchQuery.toLowerCase().trim();
        if (!query) return this.treeNodes();

        const filtered = this.filterTree(this.treeNodes(), query);
        return filtered;
    });

    selectedCount = computed(() => {
        return this.countSelected(this.treeNodes());
    });

    ngOnInit() {
        this.initializeTree();
    }

    ngOnChanges() {
        this.initializeTree();
    }

    private initializeTree() {
        const selectedIds = new Set(this.selectedPermissionIds());
        this.treeNodes.set(
            this.permissions().map(p => this.toPermissionNode(p, selectedIds))
        );
        this.updateParentStates();
    }

    private toPermissionNode(permission: Permission, selectedIds: Set<string>): PermissionNode {
        const node: PermissionNode = {
            ...permission,
            selected: selectedIds.has(permission.id),
            expanded: false,
            indeterminate: false,
            children: permission.children?.map(c => this.toPermissionNode(c, selectedIds)) as PermissionNode[]
        };
        return node;
    }

    toggleExpand(node: PermissionNode) {
        node.expanded = !node.expanded;
        this.treeNodes.set([...this.treeNodes()]);
    }

    expandAll() {
        this.setExpandedRecursive(this.treeNodes(), true);
        this.treeNodes.set([...this.treeNodes()]);
    }

    collapseAll() {
        this.setExpandedRecursive(this.treeNodes(), false);
        this.treeNodes.set([...this.treeNodes()]);
    }

    private setExpandedRecursive(nodes: PermissionNode[], expanded: boolean) {
        for (const node of nodes) {
            if (node.children && node.children.length > 0) {
                node.expanded = expanded;
                this.setExpandedRecursive(node.children, expanded);
            }
        }
    }

    toggleSelection(node: PermissionNode) {
        node.selected = !node.selected;
        node.indeterminate = false;

        // Update children
        if (node.children) {
            this.setSelectedRecursive(node.children, node.selected);
        }

        // Update parents
        this.updateParentStates();

        // Emit selection
        this.emitSelection();
    }

    private setSelectedRecursive(nodes: PermissionNode[], selected: boolean) {
        for (const node of nodes) {
            node.selected = selected;
            node.indeterminate = false;
            if (node.children) {
                this.setSelectedRecursive(node.children, selected);
            }
        }
    }

    private updateParentStates() {
        this.updateParentStateRecursive(this.treeNodes());
    }

    private updateParentStateRecursive(nodes: PermissionNode[]): { allSelected: boolean, someSelected: boolean } {
        for (const node of nodes) {
            if (node.children && node.children.length > 0) {
                const childState = this.updateParentStateRecursive(node.children);

                if (childState.allSelected) {
                    node.selected = true;
                    node.indeterminate = false;
                } else if (childState.someSelected) {
                    node.selected = false;
                    node.indeterminate = true;
                } else {
                    node.selected = false;
                    node.indeterminate = false;
                }
            }
        }

        const allSelected = nodes.every(n => n.selected);
        const someSelected = nodes.some(n => n.selected || n.indeterminate);

        return { allSelected, someSelected };
    }

    selectAll() {
        this.setSelectedRecursive(this.treeNodes(), true);
        this.updateParentStates();
        this.emitSelection();
    }

    clearAll() {
        this.setSelectedRecursive(this.treeNodes(), false);
        this.updateParentStates();
        this.emitSelection();
    }

    private emitSelection() {
        const selectedIds = this.getSelectedIds(this.treeNodes());
        this.selectionChange.emit(selectedIds);
    }

    private getSelectedIds(nodes: PermissionNode[]): string[] {
        const ids: string[] = [];
        for (const node of nodes) {
            if (node.selected && (!node.children || node.children.length === 0)) {
                ids.push(node.id);
            }
            if (node.children) {
                ids.push(...this.getSelectedIds(node.children));
            }
        }
        return ids;
    }

    private countSelected(nodes: PermissionNode[]): number {
        let count = 0;
        for (const node of nodes) {
            if (node.selected && (!node.children || node.children.length === 0)) {
                count++;
            }
            if (node.children) {
                count += this.countSelected(node.children);
            }
        }
        return count;
    }

    private filterTree(nodes: PermissionNode[], query: string): PermissionNode[] {
        const filtered: PermissionNode[] = [];

        for (const node of nodes) {
            const matches =
                node.displayName.toLowerCase().includes(query) ||
                node.description?.toLowerCase().includes(query) ||
                node.resource.toLowerCase().includes(query);

            const filteredChildren = node.children ? this.filterTree(node.children, query) : [];

            if (matches || filteredChildren.length > 0) {
                filtered.push({
                    ...node,
                    expanded: true, // Auto-expand matching nodes
                    children: filteredChildren
                });
            }
        }

        return filtered;
    }

    getNodeDepth(node: PermissionNode): number {
        if (!node.parentId) return 0;

        // Count dots in resource path as depth indicator
        const parts = node.resource.split('.');
        return parts.length - 1;
    }

    onSearchChange(query: string) {
        this.searchQuery = query;
    }
}
