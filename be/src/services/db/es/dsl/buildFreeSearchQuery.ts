import vars from "../../../../vars";
import { tokenizeSearch } from "../../../../utilities/tokenizeSearch";
import { cardSearchSourceFields } from "../sourceFields/cardSearchSourceFields";
import { freeSearchFields } from "./freeSearchFields";
import { fuzzySearchFields } from "./fuzzySearchFields";

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
  const innerHitsSize = options?.innerHitsSize ?? 3000;
  const minScore = options?.minScore ?? 12.0;

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
                          fields: freeSearchFields,
                          type: "cross_fields",
                          operator: "AND",
                          tie_breaker: 0.3,
                          boost: 2.0
                        }
                      },
                      {
                        multi_match: {
                          query: trimmed,
                          fields: fuzzySearchFields,
                          type: "best_fields",
                          operator: "AND",
                          fuzziness: "AUTO",
                          prefix_length: 1,
                          max_expansions: 30,
                          tie_breaker: 0.3,
                          boost: 1.0
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
