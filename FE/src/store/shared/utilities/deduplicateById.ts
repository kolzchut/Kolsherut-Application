export const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    return items.reduce((acc, item) => {
        if (!acc.some(existing => existing.id === item.id)) {
            acc.push(item);
        }
        return acc;
    }, [] as T[]);
};
