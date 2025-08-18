import PoiData from "../../../../../types/poiData.ts";

export const groupByOrganization = (features: PoiData[]): Map<string, PoiData[]> => {
    const map = new Map<string, PoiData[]>();
    features.forEach(f => {
        const key = f.organization_name || '';
        const arr = map.get(key);
        if (arr) arr.push(f); else map.set(key, [f]);
    });
    return map;
}

export const getCommonFooterText = (features: PoiData[]): string | null => {
    if (!features.length) return null;
    const trim = (s?: string) => (s || '').trim();

    const firstAddr = trim(features[0].branch_address);
    const sameAddress = !!firstAddr && features.every(f => trim(f.branch_address) === firstAddr);
    if (sameAddress) return firstAddr;

    return null;
}
