export class TenantNotFoundException extends Error {
    constructor(tenantId: string) {
        super(`Tenant '${tenantId}' not found.`);
        this.name = 'TenantNotFoundException';
    }
}

export class EditionNotFoundException extends Error {
    constructor(editionId: string) {
        super(`Edition '${editionId}' not found.`);
        this.name = 'EditionNotFoundException';
    }
}

export class InvalidSubscriptionEndDateException extends Error {
    constructor(message = 'Invalid subscription end date.') {
        super(message);
        this.name = 'InvalidSubscriptionEndDateException';
    }
}

export class InvalidEffectiveDateException extends Error {
    constructor(message = 'Invalid effective date.') {
        super(message);
        this.name = 'InvalidEffectiveDateException';
    }
}

export class ScheduledChangeNotSupportedException extends Error {
    constructor(message = 'Scheduled changes are not supported yet.') {
        super(message);
        this.name = 'ScheduledChangeNotSupportedException';
    }
}

export class ReactivationNotAllowedException extends Error {
    constructor(message = 'Reactivation is not allowed.') {
        super(message);
        this.name = 'ReactivationNotAllowedException';
    }
}

export class InvalidSuspensionReasonException extends Error {
    constructor(message = 'Suspension reason is required.') {
        super(message);
        this.name = 'InvalidSuspensionReasonException';
    }
}
