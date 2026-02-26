import { executeESQuery } from './es';
import mapElasticsearchHitsToServiceHierarchy from "../../../utilities/mapElasticsearchHitsToServiceHierarchy";
import buildSearchQuery from "./dsl/buildSearchQuery";
import vars from "../../../vars";
import { cardSearchSourceFields } from "./sourceFields/cardSearchSourceFields";
import buildFreeSearchQuery from "./dsl/buildFreeSearchQuery";
import logger from "../../logger/logger";

export default async ({ fixedSearchQuery, isFast, responseId, situationId,serviceName, by }: {
    fixedSearchQuery: string,
    isFast: boolean,
    responseId: string,
    situationId: string,
    serviceName: string,
    by: string
}) => {
    const searchedWithOnlyResponse = !situationId && !!responseId;
    const freeSearch = !!(fixedSearchQuery && !responseId && !situationId && !by && !serviceName);

    const mustConditions = [];


    if (responseId) {
        mustConditions.push({
            wildcard: {
                "responses.id": `*${responseId}*`
            }
        });
    }

    if (situationId) {
        mustConditions.push({
            wildcard: {
                "situations.id": `*${situationId}*`
            }
        });
    }

    if (by) {
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
    if (serviceName) {
        mustConditions.push({
            match: {
                "service_name": {
                    query: serviceName,
                    operator: "and"
                }
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
        );
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
        return mapElasticsearchHitsToServiceHierarchy({
            elasticsearchResponse: response,
            sortByScore: !freeSearch,
            searchedWithOnlyResponse
        });
    } catch (error) {
        logger.error({service:"Search Cards", message: 'Error executing search query', payload: error});
        throw error;
    }
};
