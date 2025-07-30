import {executeESQuery} from './es';
import transformCardIdToNewFormat from "../../../utilities/transformCardIdToNewFormat";
import buildCardSearchQuery from "./dsl/buildCardSearchQuery";
import vars from "../../../vars";

export default async ({fixedSearchQuery, isFast}: { fixedSearchQuery: string, isFast: boolean }) => {
    const mustConditions = [];

    if (fixedSearchQuery) {
        mustConditions.push({
            multi_match: {
                query: fixedSearchQuery,
                fields: ["service_name", "service_description", "organization_name", "branch_name", "branch_address", "branch_city", "responses.id", "situations.id"],
                fuzziness: "AUTO"
            }
        });
    }

    const sourceFields = [
        "service_id",
        "service_name",
        "service_description",
        "organization_id",
        "organization_name",
        "organization_short_name",
        "branch_id",
        "branch_name",
        "branch_address",
        "branch_location_accurate",
        "branch_city",
        "branch_geometry",
        "national_service",
        "address_parts",
        "card_id",
        "responses",
        "response_category",
        "point_id",
        "collapse_key",
        "situations"
    ];
    const propsForQuery = isFast ? vars.defaultParams.searchCards.fast : vars.defaultParams.searchCards.rest;

    const query = buildCardSearchQuery({
        mustConditions,
        sourceFields,
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
}
;
