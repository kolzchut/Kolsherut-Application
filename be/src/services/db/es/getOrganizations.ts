import { executeESQuery, executeESScrollQuery, clearESScroll } from "./es";
import buildGetAllOrganizationsForSitemap from "./dsl/buildGetAllOrganizationsForSitemap";

export interface OrganizationFields {
    organization_id: string;
    organization_short_name: string;
    organization_name: string;
    last_modified: string;
}

const extractOrganizations = (hits: any[], seen: Map<string, OrganizationFields>) => {
    for (const hit of hits) {
        const src = (hit as any)._source;
        const name = src.organization_short_name || src.organization_name;
        if (name && !seen.has(name)) {
            seen.set(name, {
                organization_id: src.organization_id,
                organization_short_name: src.organization_short_name,
                organization_name: src.organization_name,
                last_modified: src.airtable_last_modified
            });
        }
    }
};

export const fetchAllOrganizations = async ({ pageSize = 9000, scrollTime = "30s" } = {}): Promise<OrganizationFields[]> => {
    const seen = new Map<string, OrganizationFields>();

    const initialQuery = buildGetAllOrganizationsForSitemap({ pageSize, scrollTime });
    let scrollResult = await executeESQuery(initialQuery);
    let scrollId = scrollResult._scroll_id;
    let hits = scrollResult.hits?.hits || [];

    extractOrganizations(hits, seen);

    while (hits.length > 0 && scrollId) {
        const scrollContinue = { scroll_id: scrollId, scroll: scrollTime };
        scrollResult = await executeESScrollQuery(scrollContinue);
        scrollId = scrollResult._scroll_id;
        hits = scrollResult.hits?.hits || [];
        extractOrganizations(hits, seen);
    }

    if (scrollId) await clearESScroll(scrollId);

    return Array.from(seen.values());
};
