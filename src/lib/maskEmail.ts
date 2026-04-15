/**
 * Masks an email for display in UI: `mariano@gmail.com` -> `ma***@gmail.com`.
 * Keeps the first 2 chars of the local part and the full domain.
 * Returns the input unchanged if it doesn't look like an email.
 */
export function maskEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    const at = email.indexOf('@');
    if (at < 0) return email;
    const local = email.slice(0, at);
    const domain = email.slice(at);
    if (local.length <= 2) return `${local}***${domain}`;
    return `${local.slice(0, 2)}***${domain}`;
}
