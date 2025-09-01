import vars from "../../../../vars";
import autoCompleteForBranchesFields from "../sourceFields/autoCompleteFromCardFields";

export default (search: string) => {
    const trimmed = (search || "").trim();
    const hasSearch = !!trimmed;

    return ({
        index: vars.serverSetups.elastic.indices.card,
        body: {
            from: 0,
            size: 3,
            min_score: vars.serverSetups.elastic.autocompleteMinScore,
            query: {
                function_score: {
                    query: {
                        bool: {
                            must: [
                                hasSearch ? {
                                    multi_match: {
                                        query: trimmed,
                                        fields: autoCompleteForBranchesFields,
                                        type: "cross_fields",
                                        operator: "AND",
                                        tie_breaker: 0.3
                                    }
                                } : { match_none: {} }
                            ],
                            should: hasSearch ? [
                                { terms: { situation_ids_parents: [trimmed] } },
                                { terms: { response_ids_parents: [trimmed] } },
                                { terms: { possible_autocomplete: [trimmed] } },
                                { terms: { coords: [trimmed] } },
                                {
                                    multi_match: {
                                        query: trimmed,
                                        fields: autoCompleteForBranchesFields,
                                        type: "phrase",
                                        boost: 2
                                    }
                                }
                            ] : [],
                            minimum_should_match: 0
                        }
                    },
                    functions: [
                        {
                            field_value_factor: {
                                field: "score",
                                modifier: "sqrt",
                                missing: 1
                            }
                        }
                    ],
                    score_mode: "multiply",
                    boost_mode: "multiply"
                }
            },
            sort: [
                { _score: "desc" }
            ],
            highlight: {
                fields: {
                    branch_city: { number_of_fragments: 0 },
                    "branch_city.hebrew": { number_of_fragments: 0 },
                    service_name: { number_of_fragments: 0 },
                    "service_name.hebrew": { number_of_fragments: 0 }
                }
            }
        }
    });
}
