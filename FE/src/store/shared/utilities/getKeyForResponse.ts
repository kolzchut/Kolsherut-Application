export const getKeyForResponse = (id: string): string | null => {
    const keyParts = id.split(':').reverse();
    if (keyParts[keyParts.length - 1] !== 'human_services') return null;
    const {titles} = window.filters.responses;
    for (const part of keyParts) {
        if (titles[part]) return titles[part];
    }
    return null;
}
