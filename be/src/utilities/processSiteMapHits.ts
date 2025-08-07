interface SiteMapSets {
    cardIds: Set<string>;
    responses: { id: string, name: string }[];
    situations: { id: string, name: string }[];
}

export const processSiteMapHits = (hits: any[]): SiteMapSets => {
    const cardIds = new Set<string>();
    const responsesMap = new Map<string, { id: string, name: string }>();
    const situationsMap = new Map<string, { id: string, name: string }>();

    hits.forEach((hit: any) => {
        const source = hit._source;
        if (!source) return;

        if (source.card_id) cardIds.add(source.card_id);

        if (Array.isArray(source.responses)) {
            source.responses.forEach((response: any) => {
                if (response?.id && response?.name) responsesMap.set(response.id, {
                    id: response.id,
                    name: response.name
                });

            });
        }

        if (Array.isArray(source.situations)) {
            source.situations.forEach((situation: any) => {
                if (situation?.id && situation?.name) situationsMap.set(situation.id, {
                    id: situation.id,
                    name: situation.name
                });

            });
        }
    });

    return {
        cardIds,
        responses: Array.from(responsesMap.values()),
        situations: Array.from(situationsMap.values())
    };
};
