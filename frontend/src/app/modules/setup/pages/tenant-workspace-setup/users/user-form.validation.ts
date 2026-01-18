import { CreateUserFormState, InviteUsersFormState } from './users.types';
import { dedupeEmails, isValidEmail } from './user-input.parsers';

export type ValidationSummaryItem = { id: string; label: string };

export type ValidationResult = {
    fieldErrors: Record<string, string>;
    summary: ValidationSummaryItem[];
    canSubmit: boolean;
};

type CreateUserValidationContext = {
    existingEmails: string[];
};

type InviteUsersValidationContext = {
    existingEmails: string[];
};

const addError = (
    errors: Record<string, string>,
    summary: ValidationSummaryItem[],
    id: string,
    label: string,
    message: string,
) => {
    if (!errors[id]) {
        errors[id] = message;
        summary.push({ id, label });
    }
};

export const validateCreateUser = (
    form: CreateUserFormState,
    context: CreateUserValidationContext,
): ValidationResult => {
    const errors: Record<string, string> = {};
    const summary: ValidationSummaryItem[] = [];
    const normalizedEmails = context.existingEmails.map(email => email.toLowerCase());

    if (!form.name.trim()) {
        addError(errors, summary, 'create-user-name', 'Full name', 'Full name is required.');
    }

    const email = form.email.trim();
    if (!email) {
        addError(errors, summary, 'create-user-email', 'Email', 'Email is required.');
    } else if (!isValidEmail(email)) {
        addError(errors, summary, 'create-user-email', 'Email', 'Enter a valid email address.');
    } else if (normalizedEmails.includes(email.toLowerCase())) {
        addError(errors, summary, 'create-user-email', 'Email', 'Email already exists in this workspace.');
    }

    if (!form.roleId) {
        addError(errors, summary, 'create-user-role', 'Role', 'Role is required.');
    }

    if (form.schoolAccessScope === 'selected' && form.selectedSchoolIds.length === 0) {
        addError(errors, summary, 'create-user-school-access', 'School access', 'Select at least one school.');
    }

    if (!form.generatePassword && !form.password.trim()) {
        addError(errors, summary, 'create-user-password', 'Password', 'Password is required.');
    }

    return {
        fieldErrors: errors,
        summary,
        canSubmit: summary.length === 0,
    };
};

export const validateInviteUsers = (
    form: InviteUsersFormState,
    context: InviteUsersValidationContext,
): ValidationResult => {
    const errors: Record<string, string> = {};
    const summary: ValidationSummaryItem[] = [];
    const normalizedExisting = context.existingEmails.map(email => email.toLowerCase());

    if (!form.emails.length) {
        addError(errors, summary, 'invite-emails', 'Email addresses', 'Add at least one email.');
    }

    const invalid = form.emails.filter(email => !isValidEmail(email));
    if (invalid.length) {
        addError(errors, summary, 'invite-emails', 'Email addresses', 'Remove invalid email addresses.');
    }

    const { duplicates } = dedupeEmails(form.emails);
    if (duplicates.length) {
        addError(errors, summary, 'invite-emails', 'Email addresses', 'Remove duplicate email addresses.');
    }

    const alreadyExists = form.emails.some(email => normalizedExisting.includes(email.toLowerCase()));
    if (alreadyExists) {
        addError(errors, summary, 'invite-emails', 'Email addresses', 'Some emails already exist in this workspace.');
    }

    if (form.schoolAccessScope === 'selected' && form.selectedSchoolIds.length === 0) {
        addError(errors, summary, 'invite-school-access', 'School access', 'Select at least one school.');
    }

    return {
        fieldErrors: errors,
        summary,
        canSubmit: summary.length === 0,
    };
};
