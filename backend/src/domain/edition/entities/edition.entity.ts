import { DuplicateEditionNameException } from '../../exceptions/duplicate-edition-name.exception';

export interface EditionProps {
    id: string;
    name: string;
    displayName: string;
    description?: string | null;
    isActive?: boolean;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Edition {
    readonly id: string;
    readonly name: string;
    private _displayName: string;
    private _description?: string | null;
    private _isActive: boolean;
    private _sortOrder: number;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;

    private constructor(props: EditionProps) {
        this.id = props.id;
        this.name = props.name;
        this._displayName = props.displayName;
        this._description = props.description ?? null;
        this._isActive = props.isActive ?? true;
        this._sortOrder = props.sortOrder ?? 0;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: EditionProps, opts?: { nameExists?: boolean }): Edition {
        const name = props.name?.trim();
        if (!name) {
            throw new Error('Edition name is required.');
        }
        if (opts?.nameExists) {
            throw new DuplicateEditionNameException(name);
        }
        if (!props.displayName?.trim()) {
            throw new Error('Edition display name is required.');
        }
        if ((props.sortOrder ?? 0) < 0) {
            throw new Error('Edition sortOrder must be >= 0.');
        }
        return new Edition({ ...props, name });
    }

    get displayName(): string {
        return this._displayName;
    }

    get description(): string | null | undefined {
        return this._description;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get sortOrder(): number {
        return this._sortOrder;
    }

    activate(): void {
        this._isActive = true;
    }

    deactivate(): void {
        this._isActive = false;
    }

    updateDisplayName(displayName: string): void {
        if (!displayName?.trim()) {
            throw new Error('Edition display name is required.');
        }
        this._displayName = displayName.trim();
    }

    updateDescription(description: string | null | undefined): void {
        this._description = description ?? null;
    }

    updateSortOrder(sortOrder: number): void {
        if (sortOrder < 0) {
            throw new Error('Edition sortOrder must be >= 0.');
        }
        this._sortOrder = sortOrder;
    }
}
