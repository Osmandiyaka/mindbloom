export function truncate(s: string, len = 80) { return s?.length > len ? s.slice(0, len - 1) + '…' : s; }
