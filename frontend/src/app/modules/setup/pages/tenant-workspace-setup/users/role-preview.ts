export type RolePreviewItem = {
    title: string;
    description?: string;
};

const HIGH_PRIVILEGE_ROLES = ['Owner', 'Administrator'];

const ROLE_PREVIEW_MAP: Record<string, RolePreviewItem[]> = {
    Owner: [
        { title: 'Full administrative access', description: 'Manage billing, settings, and security.' },
        { title: 'User & role management', description: 'Create, edit, and revoke access.' },
        { title: 'Data exports', description: 'Export data across the workspace.' },
    ],
    Administrator: [
        { title: 'Workspace management', description: 'Manage settings, users, and configurations.' },
        { title: 'Academic operations', description: 'Edit academic structures and classes.' },
        { title: 'Reporting access', description: 'View and export operational reports.' },
    ],
    Staff: [
        { title: 'Operational workflows', description: 'Manage day-to-day tasks and records.' },
        { title: 'Limited settings', description: 'Access assigned modules only.' },
        { title: 'Reporting access', description: 'View assigned reports.' },
    ],
    Teacher: [
        { title: 'Classroom access', description: 'Manage assigned classes and students.' },
        { title: 'Grading tools', description: 'Enter grades and attendance.' },
        { title: 'Limited administration', description: 'No billing or security permissions.' },
    ],
};

export const isHighPrivilegeRole = (roleName: string): boolean => {
    return HIGH_PRIVILEGE_ROLES.includes(roleName);
};

export const getRolePreviewItems = (roleName: string): RolePreviewItem[] => {
    return ROLE_PREVIEW_MAP[roleName] ?? [
        { title: 'Custom role', description: 'Permissions are defined in the role settings.' },
        { title: 'Scoped access', description: 'Access follows configured scopes.' },
    ];
};

export const getRoleBadge = (roleName: string): 'System' | 'Custom' => {
    return ROLE_PREVIEW_MAP[roleName] ? 'System' : 'Custom';
};
