import { executeESQuery, executeESScrollQuery, clearESScroll } from "./es";
import buildGetAllCardForSitemap from "./dsl/buildGetAllCardForSitemap";

interface CardFields {
    card_id: string;
    service_boost: number;
    last_modified: string;
}

interface ScrollFetchParams {
    pageSize?: number;
    scrollTime?: string;
}

export const fetchAllCardFields = async ({pageSize = 9000, scrollTime = "30s"}: ScrollFetchParams = {}): Promise<CardFields[]> => {
    let allCards: CardFields[] = [];

    const initialQuery = buildGetAllCardForSitemap({ pageSize, scrollTime });

    let scrollResult = await executeESQuery(initialQuery);
    let scrollId = scrollResult._scroll_id;
    let hits = scrollResult.hits?.hits || [];

    allCards.push(
        ...hits.map((hit:any) => ({
            card_id: hit._source.card_id,
            service_boost: hit._source.service_boost,
            last_modified: hit._source.last_modified
        }))
    );

    while (hits.length > 0 && scrollId) {
        const scrollContinue = { scroll_id: scrollId, scroll: scrollTime };
        scrollResult = await executeESScrollQuery(scrollContinue);
        scrollId = scrollResult._scroll_id;
        hits = scrollResult.hits?.hits || [];

        allCards.push(
            ...hits.map((hit:any) => ({
                card_id: hit._source.card_id,
                service_boost: hit._source.service_boost,
                last_modified: hit._source.last_modified
            }))
        );
    }

    if (scrollId) await clearESScroll(scrollId);

    return allCards;
};
