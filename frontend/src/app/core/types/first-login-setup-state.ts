export type FirstLoginSetupStatus = 'not_started' | 'in_progress' | 'skipped' | 'completed';

export interface FirstLoginSetupState {
    status: FirstLoginSetupStatus;
    step: number;
    startedAt?: string;
    skippedAt?: string;
    completedAt?: string;
    data?: Record<string, any>;
}
