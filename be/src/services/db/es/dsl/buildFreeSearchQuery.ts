import vars from "../../../../vars";
import { tokenizeSearch } from "../../../../utilities/tokenizeSearch";
import { cardSearchSourceFields } from "../sourceFields/cardSearchSourceFields";

export default (
  search: string,
  options?: {
    size?: number;
    from?: number;
    innerHitsSize?: number;
    collapseKey?: string;
    minScore?: number;
  }
) => {
  const { trimmed, termsArray } = tokenizeSearch(search);

  const size = options?.size ?? 1000;
  const from = options?.from ?? 0;
  const innerHitsSize = options?.innerHitsSize ?? 1000;
  const minScore = options?.minScore ?? 25.0;

  const outerBool: any = {
    must: [
      {
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
                            "address_parts.primary^1.0",
                            "address_parts.secondary^1.0",
                            "branch_address^1.0",
                            "branch_city^1.0",
                            "branch_description^1.0",
                            "branch_description.hebrew^1.0",
                            "branch_operating_unit^1.0",
                            "branch_orig_address^1.0",
                            "national_service_details^1.0",
                            "national_service_details.hebrew^1.0",
                            "organization_description^1.0",
                            "organization_description.hebrew^1.0",
                            "organization_kind^1.0",
                            "organization_name_parts.primary^1.0",
                            "organization_name_parts.secondary^1.0",
                            "organization_purpose^1.0",
                            "organization_purpose.hebrew^1.0",
                            "service_details^1.0",
                            "service_details.hebrew^1.0",
                            "service_implements^1.0",
                            "service_payment_details^1.0",
                            "service_payment_details.hebrew^1.0",
                            "branch_name^10.0",
                            "branch_name.hebrew^10.0",
                            "organization_name^10.0",
                            "organization_name.hebrew^10.0",
                            "organization_original_name^10.0",
                            "organization_original_name.hebrew^10.0",
                            "organization_resolved_name^10.0",
                            "organization_resolved_name.hebrew^10.0",
                            "organization_short_name^10.0",
                            "organization_short_name.hebrew^10.0",
                            "responses.name^10.0",
                            "responses.name.hebrew^10.0",
                            "responses.synonyms^10.0",
                            "responses.synonyms.hebrew^10.0",
                            "responses_parents.name^10.0",
                            "responses_parents.name.hebrew^10.0",
                            "responses_parents.synonyms^10.0",
                            "responses_parents.synonyms.hebrew^10.0",
                            "situations.name^10.0",
                            "situations.name.hebrew^10.0",
                            "situations.synonyms^10.0",
                            "situations.synonyms.hebrew^10.0",
                            "situations_parents.name^10.0",
                            "situations_parents.name.hebrew^10.0",
                            "situations_parents.synonyms^10.0",
                            "situations_parents.synonyms.hebrew^10.0",
                            "service_name^10.0",
                            "service_name.hebrew^10.0",
                            "service_description^3.0",
                            "service_description.hebrew^3.0"
                          ],
                          type: "cross_fields",
                          operator: "AND",
                          tie_breaker: 0.3
                        }
                      },
                      ...(termsArray.length
                        ? [
                            { terms: { situation_ids_parents: termsArray } },
                            { terms: { response_ids_parents: termsArray } },
                            { terms: { possible_autocomplete: termsArray } },
                            { terms: { coords: termsArray } }
                          ]
                        : [])
                    ]
                  }
                }
              ],
            }
          },
          functions: [
            {
              field_value_factor: {
                field: "score",
                factor: 1.0,
                missing: 1.0,
                modifier: "sqrt"
              }
            }
          ],
          score_mode: "multiply",
          boost_mode: "multiply"
        }
      }
    ]
  };

  if (options?.collapseKey) {
    outerBool.filter = [
      { term: { collapse_key: options.collapseKey } }
    ];
  }

  return {
    index: vars.serverSetups.elastic.indices.card,
    body: {
      from,
      size,
      query: {
        bool: outerBool
      },
      min_score: minScore,
      aggregations: {
        collapse_key: {
          terms: {
            field: "collapse_key",
            size: 20000,
            order: [{ _count: "desc" }, { _key: "asc" }]
          }
        }
      },
      highlight: {
        highlight_query: {
          multi_match: {
            query: trimmed,
            fields: [
              "branch_address^1.0",
              "branch_operating_unit^1.0",
              "organization_name^1.0",
              "organization_purpose^1.0",
              "organization_purpose.hebrew^1.0",
              "organization_short_name^1.0",
              "responses.name.hebrew^1.0",
              "service_description^1.0",
              "service_description.hebrew^1.0",
              "service_details^1.0",
              "service_details.hebrew^1.0",
              "service_name^1.0",
              "service_name.hebrew^1.0",
              "situations.name.hebrew^1.0"
            ],
            type: "best_fields",
            operator: "OR"
          }
        },
        fields: {
          service_name: { number_of_fragments: 0 },
          "service_name.hebrew": { number_of_fragments: 0 },
          organization_name: { number_of_fragments: 0 },
          organization_short_name: { number_of_fragments: 0 },
          branch_operating_unit: { number_of_fragments: 0 },
          "situations.name.hebrew": { number_of_fragments: 0 },
          "responses.name.hebrew": { number_of_fragments: 0 },
          "service_description.hebrew": {},
          service_description: {},
          "organization_purpose.hebrew": {},
          organization_purpose: {},
          "service_details.hebrew": {},
          service_details: {},
          branch_address: {}
        }
      },
      collapse: {
        field: "service_id",
        inner_hits: {
          name: "collapse_hits",
          size: innerHitsSize,
          _source: cardSearchSourceFields,
          sort: [
            { score: { order: "desc" } },
            { national_service: { order: "desc" } }
          ]
        }
      },
      _source: cardSearchSourceFields,
      sort: [
        { _score: { order: "desc" } }
      ]
    }
  };
};
