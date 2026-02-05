import vars from "../../../../vars";

interface BuildCardSearchQueryParams {
    mustConditions: any[];
    size?: number;
    offset?: number;
    innerHitsSize?: number;
    collapseField?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    sourceFields: string[];
    sort?: boolean;
    manualSort?: boolean;
}

export default function buildSearchQuery({
    mustConditions,
    size = 1500,
    offset = 0,
    innerHitsSize = 3000,
    collapseField = "service_id",
    sortField = "score",
    sortOrder = "desc",
    sourceFields,
    manualSort = false
}: BuildCardSearchQueryParams) {
    const queryBody: any = {
        size,
        from: offset,
        query: {
            bool: {
                must: mustConditions
            }
        },
        collapse: {
            field: collapseField,
            inner_hits: {
                name: "collapse_hits",
                size: innerHitsSize,
                _source: sourceFields
            }
        },
        _source: sourceFields
    };

    if (manualSort) {
        queryBody.sort = [
            {
                [sortField]: {
                    order: sortOrder
                }
            }
        ];
        queryBody.collapse.inner_hits.sort = [
            {
                [sortField]: {
                    order: sortOrder
                }
            }
        ];
    }

    return {
        index: vars.serverSetups.elastic.indices.card,
        body: queryBody
    };
}
