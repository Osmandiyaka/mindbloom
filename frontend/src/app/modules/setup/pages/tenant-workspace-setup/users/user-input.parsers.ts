export type ParsedCsvUserRow = {
    name: string;
    email: string;
    roleName?: string;
};

export const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const parseEmailList = (input: string): string[] => {
    return input
        .split(/[\n,;\s]+/g)
        .map(value => value.trim())
        .filter(Boolean);
};

export const dedupeEmails = (emails: string[]): { unique: string[]; duplicates: string[] } => {
    const seen = new Set<string>();
    const unique: string[] = [];
    const duplicates: string[] = [];
    for (const email of emails) {
        const normalized = email.toLowerCase();
        if (seen.has(normalized)) {
            duplicates.push(email);
            continue;
        }
        seen.add(normalized);
        unique.push(email);
    }
    return { unique, duplicates };
};

const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            const nextChar = line[i + 1];
            if (inQuotes && nextChar === '"') {
                current += '"';
                i += 1;
                continue;
            }
            inQuotes = !inQuotes;
            continue;
        }
        if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    result.push(current.trim());
    return result;
};

export const parseCsvUsers = (text: string): ParsedCsvUserRow[] => {
    const rows = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (!rows.length) return [];
    const parsed: ParsedCsvUserRow[] = [];
    for (const line of rows) {
        const [name, email, roleName] = parseCsvLine(line);
        if (!email || !isValidEmail(email)) continue;
        parsed.push({
            name: name ?? '',
            email,
            roleName: roleName || undefined,
        });
    }
    return parsed;
};
