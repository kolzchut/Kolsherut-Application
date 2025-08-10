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
}

export default function buildCardSearchQuery({
    mustConditions,
    size = 1500,
    offset = 0,
    innerHitsSize = 1000,
    collapseField = "service_id",
    sortField = "score",
    sortOrder = "desc",
    sourceFields
}: BuildCardSearchQueryParams) {
    return {
        index: vars.serverSetups.elastic.indices.card,
        body: {
            size,
            from: offset,
            query: {
                bool: {
                    must: mustConditions
                }
            },
            sort: [
                {
                    [sortField]: {
                        order: sortOrder
                    }
                }
            ],
            collapse: {
                field: collapseField,
                inner_hits: {
                    name: "collapse_hits",
                    size: innerHitsSize,
                    sort: [
                        {
                            [sortField]: {
                                order: sortOrder
                            }
                        }
                    ],
                    _source: sourceFields
                }
            },
            _source: sourceFields
        }
    };
}
