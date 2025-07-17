export const translateKeyToTitle = (key: string): string => {
    const {titles} = window.filters.situations
    if (!titles[key]) return key;
    return titles[key];
}
