export const uniqueBy = <T>({arr,key}:{arr: T[], key: keyof T}): T[] => {
    const seen = new Set<unknown>();
    return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
};
