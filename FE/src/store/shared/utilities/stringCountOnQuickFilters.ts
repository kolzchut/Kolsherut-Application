const stringCountOnQuickFilters = ({count, totalBranches}: {
    count: number | string,
    totalBranches: number
}): string => {
    if(count === 0) return `${totalBranches + count}`;
    if (!count) return '';
    if (typeof count === 'number') {
        if (count > 0) return `+${count}`
        return `${totalBranches + count}`;
    }
    return count;
}
export default stringCountOnQuickFilters;
