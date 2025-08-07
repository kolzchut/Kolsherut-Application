import {executeESQuery, executeESScrollQuery, clearESScroll} from "./es";
import {siteMapFields} from "./sourceFields/siteMapFields";
import {processSiteMapHits} from "../../../utilities/processSiteMapHits";
import buildSiteMapScrollQuery from "./dsl/buildSiteMapScrollQuery";


export default async () => {
    let allHits: any[] = [];

    const scrollQuery = buildSiteMapScrollQuery(siteMapFields);
    let scrollResult = await executeESQuery(scrollQuery);

    let scrollId = scrollResult._scroll_id;
    let hits = scrollResult.hits?.hits;

    if (hits && hits.length > 0) allHits.push(...hits);

    // Continue scrolling until no more results
    while (hits && hits.length > 0 && scrollId) {
        const scrollContinue = {
            scroll_id: scrollId,
            scroll: '30s'
        };
        scrollResult = await executeESScrollQuery(scrollContinue);
        scrollId = scrollResult._scroll_id;
        hits = scrollResult.hits?.hits;

        if (hits && hits.length > 0) allHits.push(...hits);
    }

    if (scrollId) await clearESScroll(scrollId);

    const {cardIds, responses, situations} = processSiteMapHits(allHits);

    return {
        cardIds: Array.from(cardIds),
        responses,
        situations,
    };
}
