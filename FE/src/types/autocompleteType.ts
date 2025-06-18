export default interface AutocompleteType {
    bounds: [number, number] | null; // [longitude, latitude]
    city_name?: string | null;
    id: string;
    importance?: number | null;
    low?: boolean | null;
    org_id?: string | null;
    org_name?: string | null;
    query: string;
    query_heb?: string | null;
    response?: string | null;
    response_name?: string | null;
    revision?: string | null;
    score?: number | null;
    situation?: string | null;
    situation_name?: string | null;
    structured_query: string;
    synonyms?: string[] | null;
    visible?: boolean | null;
}
