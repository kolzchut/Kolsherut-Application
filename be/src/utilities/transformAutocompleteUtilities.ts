import {IStructureAutocomplete, IUnStructuredAutocomplete} from "../types/autocomplete";

const mapHits = (resultsInElasticFormat: any) => {
    const rawHits: any[] = (resultsInElasticFormat?.hits?.hits) || [];
    return rawHits.map((hit: any) => ({
        source: hit._source,
        highlight: hit.highlight,
        _score: typeof hit._score === 'number' ? hit._score : 0
    }));
};

const buildScoreNormalizer = (mappedHits: { _score: number }[]) => {
    const scores = mappedHits.map(r => r._score);
    const min = scores.length ? Math.min(...scores) : 0;
    const max = scores.length ? Math.max(...scores) : 0;
    const range = max - min;
    return (s: number) => {
        if (!Number.isFinite(s)) s = 0;
        if (range === 0) return 100; // all equal -> maxed
        const scaled = (s - min) / range; // 0..1
        return Math.round(1 + scaled * 99); // 1..100
    };
};

const pickHighlight = (highlight: any, fallback: string) => {
    if (!highlight) return fallback;
    const candidates = [
        "query",
        "query._2gram",
        "query._3gram",
        "query_heb",
        "query_heb.hebrew"
    ];
    for (const key of candidates) {
        if (highlight[key] && Array.isArray(highlight[key]) && highlight[key].length) {
            return highlight[key][0];
        }
    }
    // If nothing matched, return fallback
    return fallback;
}

export const transformAutoCompleteFromCardStructure = (resultsInElasticFormat: any) => {
    const results = mapHits(resultsInElasticFormat);
    const normalize = buildScoreNormalizer(results);

    const unstructuredResults: IUnStructuredAutocomplete[] = [];

    results.forEach((item: any) => {
        const result = item.source;
        const label = `${result.service_name} ${result.branch_city && `(${result.branch_city})` || result.organization_name && `(${result.organization_name})` || ""}`;
        const labelHighlighted = pickHighlight(item.highlight, label);
        unstructuredResults.push({
            label,
            labelHighlighted,
            score: normalize(item._score)* 0.5,
            query: result.service_name,
            cardId: result.card_id
        });

    });
    return {
        unstructured: unstructuredResults
    };
}

export const transformAutocompleteUtilities = (resultsInElasticFormat: any, shouldMapHits=false) => {
    const results = shouldMapHits ? mapHits(resultsInElasticFormat) : resultsInElasticFormat;
    const normalize = buildScoreNormalizer(results);

    const structuredResults: IStructureAutocomplete[] = [];
    const unstructuredResults: IUnStructuredAutocomplete[] = [];

    results.forEach((item: any) => {
        const result = item.source;
        const label = result.query;
        const labelHighlighted = pickHighlight(item.highlight, label);

        if (result.situation || result.response || result.bounds) {
            structuredResults.push({
                label,
                labelHighlighted,
                query: result.id,
                situationId: result.situation,
                responseId: result.response,
                bounds: result.bounds,
                cityName: result.city_name,
                by: result.org_name,
                score: normalize(item._score),
            });
        } else {
            unstructuredResults.push({
                label,
                labelHighlighted,
                by: result.org_name,
                query: result.id,
                score: normalize(item._score),

            });
        }
    });
    return {
        structured: structuredResults,
        unstructured: unstructuredResults
    };
}
