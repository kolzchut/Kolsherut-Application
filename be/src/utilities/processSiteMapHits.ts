import SiteMapSets from "../types/siteMapSets";

const getLastModified = (source: any): string => source?.last_modified ?? 'unknown';

const isKnown = (lm: string) => lm !== 'unknown';

const shouldReplaceLastModified = (existingLM: string, incomingLM: string): boolean => {
    const incomingKnown = isKnown(incomingLM);
    const existingKnown = isKnown(existingLM);
    return incomingKnown && (!existingKnown || incomingLM > existingLM);
};

const updateCard = (
    cardsMap: Map<string, { id: string, last_modified: string, service_boost: number }>,
    cardId: string,
    lastModified: string,
    serviceBoost: number
) => {
    const existing = cardsMap.get(cardId);
    if (!existing) {
        cardsMap.set(cardId, {id: cardId, last_modified: lastModified, service_boost: serviceBoost});
        return;
    }
    if (shouldReplaceLastModified(existing.last_modified, lastModified)) {
        cardsMap.set(cardId, {id: cardId, last_modified: lastModified, service_boost: Math.max(existing.service_boost,serviceBoost)});
    }
};

const updateResponses = (
    rawResponses: any,
    responsesMap: Map<string, { id: string, name: string, last_modified: string }>,
    lastModified: string
) => {
    if (!Array.isArray(rawResponses)) return;
    rawResponses.forEach((response: any) => {
        if (response?.id && response?.name) {
            responsesMap.set(response.id, {
                id: response.id,
                name: response.name,
                last_modified: lastModified
            });
        }
    });
};

const updateSituations = (
    rawSituations: any,
    situationsMap: Map<string, { id: string, name: string, last_modified: string }>,
    lastModified: string
) => {
    if (!Array.isArray(rawSituations)) return;
    rawSituations.forEach((situation: any) => {
        if (situation?.id && situation?.name) {
            situationsMap.set(situation.id, {
                id: situation.id,
                name: situation.name,
                last_modified: lastModified
            });
        }
    });
};

const processHitPerSource = (
    source: any,
    cardsMap: Map<string, { id: string, service_boost: number, last_modified: string }>,
    responsesMap: Map<string, { id: string, name: string, last_modified: string }>,
    situationsMap: Map<string, { id: string, name: string, last_modified: string }>
) => {
    if (!source) return;
    const sourceLastModified = getLastModified(source);

    if (source.card_id) updateCard(cardsMap, source.card_id, sourceLastModified, source.service_boost);

    updateResponses(source.responses, responsesMap, sourceLastModified);
    updateSituations(source.situations, situationsMap, sourceLastModified);
};

export const processSiteMapHits = (hits: any[]): SiteMapSets => {
    const cardsMap = new Map<string, { id: string, service_boost: number, last_modified: string }>();
    const responsesMap = new Map<string, { id: string, name: string, last_modified: string }>();
    const situationsMap = new Map<string, { id: string, name: string, last_modified: string }>();

    hits.forEach((hit: any) => processHitPerSource(hit?._source, cardsMap, responsesMap, situationsMap));

    return {
        cards: Array.from(cardsMap.values()),
        responses: Array.from(responsesMap.values()),
        situations: Array.from(situationsMap.values())
    };
};
