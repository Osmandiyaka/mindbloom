import { Injectable } from '@nestjs/common';
import { createPermissionTree } from '../../../domain/rbac/entities/permission-tree';
import { Permission } from '../../../domain/rbac/entities/permission.entity';

/**
 * Use Case: Get Permission Tree
 * Returns the complete hierarchical permission tree
 */
@Injectable()
export class GetPermissionTreeUseCase {
    execute(): Permission[] {
        return createPermissionTree();
    }

    /**
     * Get flattened permission list
     */
    getFlatList(): Permission[] {
        const tree = createPermissionTree();
        const flatList: Permission[] = [];

        function flatten(permissions: Permission[]) {
            for (const permission of permissions) {
                flatList.push(permission);
                if (permission.children && permission.children.length > 0) {
                    flatten(permission.children);
                }
            }
        }

        flatten(tree);
        return flatList;
    }

    /**
     * Find a specific permission by ID
     */
    findPermissionById(permissionId: string): Permission | undefined {
        const tree = createPermissionTree();

        function search(permissions: Permission[]): Permission | undefined {
            for (const permission of permissions) {
                if (permission.id === permissionId) {
                    return permission;
                }
                if (permission.children && permission.children.length > 0) {
                    const found = search(permission.children);
                    if (found) return found;
                }
            }
            return undefined;
        }

        return search(tree);
    }

    /**
     * Get all permission IDs including children (for selecting parent with all children)
     */
    getPermissionWithChildren(permissionId: string): string[] {
        const permission = this.findPermissionById(permissionId);
        if (!permission) return [];

        const ids: string[] = [permission.id];

        function collectChildren(perm: Permission) {
            if (perm.children) {
                for (const child of perm.children) {
                    ids.push(child.id);
                    collectChildren(child);
                }
            }
        }

        collectChildren(permission);
        return ids;
    }
}
