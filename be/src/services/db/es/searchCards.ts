import {executeESQuery} from './es';
import transformCardIdToNewFormat from "../../../utilities/transformCardIdToNewFormat";
import buildCardSearchQuery from "./dsl/buildCardSearchQuery";
import vars from "../../../vars";
import { cardSearchSourceFields } from "./sourceFields/cardSearchSourceFields";

export default async ({fixedSearchQuery, isFast}: { fixedSearchQuery: string, isFast: boolean }) => {
    const mustConditions = [];

    if (fixedSearchQuery) {
        mustConditions.push({
            multi_match: {
                query: fixedSearchQuery,
                fields: ["service_name", "service_description", "organization_name", "branch_name", "branch_address","branch_city", "responses.id","situations.id"],
                fuzziness: "AUTO"
            }
        });
    }

    const propsForQuery = isFast ? vars.defaultParams.searchCards.fast : vars.defaultParams.searchCards.rest;

    const query = buildCardSearchQuery({
        mustConditions,
        sourceFields: cardSearchSourceFields,
        size: propsForQuery.size,
        offset: propsForQuery.offset,
        innerHitsSize: propsForQuery.innerHitsSize
    });

    try {
        const response = await executeESQuery(query);
        return transformCardIdToNewFormat(response);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
