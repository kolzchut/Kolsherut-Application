import {executeESQuery} from './es';
import transformCardIdToNewFormat from "../../../utilities/transformCardIdToNewFormat";
import buildSearchQuery from "./dsl/buildSearchQuery";
import vars from "../../../vars";
import {cardSearchSourceFields} from "./sourceFields/cardSearchSourceFields";
import buildFreeSearchQuery from "./dsl/buildFreeSearchQuery";

export default async ({fixedSearchQuery, isFast, responseId, situationId}: {
    fixedSearchQuery: string,
    isFast: boolean,
    responseId: string,
    situationId: string
}) => {
    const mustConditions = [];
    const freeSearch = !!(fixedSearchQuery && responseId === "" && situationId === "")
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
        return transformCardIdToNewFormat(response, !freeSearch);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
