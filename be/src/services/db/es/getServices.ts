import { executeESQuery, executeESScrollQuery, clearESScroll } from "./es";
import buildGetAllServicesForSitemap from "./dsl/buildGetAllServicesForSitemap";

export interface ServiceFields {
    service_name: string;
    service_id: string;
    last_modified: string;
}

const extractServices = (hits: any[], seen: Map<string, ServiceFields>) => {
    for (const hit of hits) {
        const src = (hit as any)._source;
        const name = src.service_name;
        if (name && !seen.has(name)) {
            seen.set(name, {
                service_name: name,
                service_id: src.service_id,
                last_modified: src.airtable_last_modified
            });
        }
    }
};

export const fetchAllServices = async ({ pageSize = 9000, scrollTime = "30s" } = {}): Promise<ServiceFields[]> => {
    const seen = new Map<string, ServiceFields>();

    const initialQuery = buildGetAllServicesForSitemap({ pageSize, scrollTime });
    let scrollResult = await executeESQuery(initialQuery);
    let scrollId = scrollResult._scroll_id;
    let hits = scrollResult.hits?.hits || [];

    extractServices(hits, seen);

    while (hits.length > 0 && scrollId) {
        const scrollContinue = { scroll_id: scrollId, scroll: scrollTime };
        scrollResult = await executeESScrollQuery(scrollContinue);
        scrollId = scrollResult._scroll_id;
        hits = scrollResult.hits?.hits || [];
        extractServices(hits, seen);
    }

    if (scrollId) await clearESScroll(scrollId);

    return Array.from(seen.values());
};
