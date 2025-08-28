import {AutocompleteBuckets, IUnStructuredAutocomplete} from "../types/autocomplete";



export const ensureAutocompleteFallback = (
    buckets: AutocompleteBuckets,
    query: string | undefined | null
): AutocompleteBuckets => {
    const hasStructured = (buckets?.structured?.length || 0) > 0;
    if (hasStructured) return buckets;

    const q = (query || "").trim();
    const unstructured = [...(buckets?.unstructured || [])];

    if (!q) return { ...buckets, unstructured };

    const exists = unstructured.some(u => (u?.label || "").trim() === q || (u?.query || "").trim() === q);
    if (!exists) {
        const fallback: IUnStructuredAutocomplete = {
            label: q,
            query: q,
            score: 100
        };
        unstructured.unshift(fallback);
    }

    return { ...buckets, unstructured };
};

export default ensureAutocompleteFallback;
