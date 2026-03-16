/**
 * ===== TEMPORARY MODULE — REQUEST COUNTER PER HOUR =====
 * Tracks how many backend requests were received in each hour.
 * Used to append stats to notification emails.
 *
 * To remove: delete this file, remove the middleware from index.ts,
 * and remove the import/call in sendTimedEmails.ts.
 * ========================================================
 */

const buckets: Map<string, number> = new Map();

function getCurrentHourKey(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:00`;
}

/** Call this on every incoming request */
export function incrementRequestCount(): void {
    const key = getCurrentHourKey();
    buckets.set(key, (buckets.get(key) || 0) + 1);
}

/**
 * Returns a formatted summary of requests per hour and clears the data.
 * Call this when composing notification emails.
 */
export function getAndResetRequestCountsSummary(): string {
    if (buckets.size === 0) return '';

    // Sort keys chronologically
    const sorted = Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, count]) => ({ hour, count }));

    const total = sorted.reduce((sum, b) => sum + b.count, 0);

    const lines = sorted.map(b => `  ${b.hour}  →  ${b.count} requests`);

    const summary = [
        '',
        '═══ Request Count Per Hour (TEMP) ═══',
        ...lines,
        `  Total: ${total} requests`,
        '══════════════════════════════════════',
    ].join('\n');

    buckets.clear();
    return summary;
}
