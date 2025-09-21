import {executeESQuery} from './es';
import mapElasticsearchHitsToServiceHierarchy from "../../../utilities/mapElasticsearchHitsToServiceHierarchy";
import buildSearchQuery from "./dsl/buildSearchQuery";
import vars from "../../../vars";
import {cardSearchSourceFields} from "./sourceFields/cardSearchSourceFields";
import buildFreeSearchQuery from "./dsl/buildFreeSearchQuery";

export default async ({fixedSearchQuery, isFast, responseId, situationId,by}: {
    fixedSearchQuery: string,
    isFast: boolean,
    responseId: string,
    situationId: string,
    by:string
}) => {
    const searchedWithOnlyResponse = !(!!situationId) && !!responseId
    const mustConditions = [];
    const freeSearch = !!(fixedSearchQuery && responseId === "" && situationId === "" && by === "")
    if (freeSearch) {
        mustConditions.push({
            multi_match: {
                query: fixedSearchQuery,
                fields: ["service_name", "service_description", "organization_name", "branch_name", "branch_address", "branch_city", "responses.id", "situations.id"],
                fuzziness: "AUTO"
            }
        });
    }

    if (responseId && responseId !== "") {
        mustConditions.push({
            wildcard: {
                "responses.id": `*${responseId}*`
            }
        });
    }

    if (situationId && situationId !== "") {
        mustConditions.push({
            wildcard: {
                "situations.id": `*${situationId}*`
            }
        });
    }

    if (by && by !== "") {
        mustConditions.push({
            bool: {
                should: [
                    { wildcard: { "organization_short_name": `*${by}*` } },
                    { wildcard: { "organization_name_parts.primary": `*${by}*` } },
                    { wildcard: { "organization_name_parts.secondary": `*${by}*` } },
                    { wildcard: { "organization_resolved_name": `*${by}*` } }
                ],
                minimum_should_match: 1
            }
        });
    }


    const propsForQuery = isFast ? vars.defaultParams.searchCards.fast : vars.defaultParams.searchCards.rest;

    let query;
    if (freeSearch) {
        query = buildFreeSearchQuery(
            fixedSearchQuery,
            {
                size: propsForQuery.size,
                from: propsForQuery.offset,
                innerHitsSize: propsForQuery.innerHitsSize,
            }
        )
    } else {
        query = buildSearchQuery({
            mustConditions,
            sourceFields: cardSearchSourceFields,
            size: propsForQuery.size,
            offset: propsForQuery.offset,
            innerHitsSize: propsForQuery.innerHitsSize,
            manualSort: true
        });
    }

    try {
        const response = await executeESQuery(query);
        return mapElasticsearchHitsToServiceHierarchy({elasticsearchResponse:response, sortByScore:!freeSearch, searchedWithOnlyResponse });
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
