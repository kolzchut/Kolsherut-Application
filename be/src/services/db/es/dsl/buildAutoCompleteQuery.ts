import vars from "../../../../vars";
import { tokenizeSearch } from "../../../../utilities/tokenizeSearch";

export default (search: string) => {
    const { trimmed, termsArray } = tokenizeSearch(search);

    return ({
        index: vars.serverSetups.elastic.indices.autocomplete,
        body: {
            from: 0,
            size: 6,
            query: {
                function_score: {
                    query: {
                        bool: {
                            must: [
                                {
                                    bool: {
                                        should: [
                                            {
                                                multi_match: {
                                                    query: trimmed,
                                                    fields: [
                                                        "city_name^10",
                                                        "city_name.hebrew^10",
                                                        "org_name^10",
                                                        "org_name.hebrew^10",
                                                        "query^10",
                                                        "query._2gram^10",
                                                        "query._3gram^10",
                                                        "query_heb^10",
                                                        "query_heb.hebrew^10",
                                                        "service_name^30",
                                                        "response_name^30",
                                                        "response_name.hebrew^10",
                                                        "situation_name^10",
                                                        "situation_name.hebrew^10",
                                                        "structured_query^1",
                                                        "structured_query.hebrew^1",
                                                        "synonyms^10",
                                                        "synonyms.hebrew^10"
                                                    ],
                                                    type: "bool_prefix",
                                                    operator: "AND",
                                                    tie_breaker: 0.3
                                                }
                                            },
                                            ...(termsArray.length ? [
                                                { terms: { response: termsArray } },
                                                { terms: { situation: termsArray } }
                                            ] : [])
                                        ],
                                        minimum_should_match: 1
                                    }
                                }
                            ],
                            filter: [
                                {
                                    bool: {
                                        must: [
                                            { term: { visible: true } },
                                            { term: { low: false } }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    functions: [
                        {
                            field_value_factor: {
                                field: "score",
                                modifier: "sqrt",
                                factor: 1,
                                missing: 1
                            }
                        }
                    ],
                    score_mode: "multiply",
                    boost_mode: "multiply"
                }
            },
            highlight: {
                require_field_match: false,
                highlight_query: trimmed ? {
                    multi_match: {
                        query: trimmed,
                        fields: [
                            "query",
                            "query._2gram",
                            "query._3gram",
                            "query_heb",
                            "query_heb.hebrew"
                        ],
                        type: "bool_prefix",
                        operator: "AND"
                    }
                } : undefined,
                fields: {
                    query: { number_of_fragments: 0 },
                    "query._2gram": { number_of_fragments: 0 },
                    "query._3gram": { number_of_fragments: 0 },
                    "query_heb": { number_of_fragments: 0 },
                    "query_heb.hebrew": { number_of_fragments: 0 }
                }
            },
            sort: [
                { _score: "desc" }
            ]
        }
    });
}
