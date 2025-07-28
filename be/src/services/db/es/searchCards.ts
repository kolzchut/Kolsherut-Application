import {executeESQuery} from './es';
import vars from "../../../vars";
import transformCardIdToNewFormat from "../../../utilities/transformCardIdToNewFormat";

export default async (fixedSearchQuery?:string) => {
    const mustConditions = [];
    const shouldConditions = [];

    if (fixedSearchQuery) {
        mustConditions.push({
            multi_match: {
                query: fixedSearchQuery,
                fields: ["service_name", "service_description", "organization_name", "branch_name", "branch_address","branch_city", "responses.id","situations.id"],
                fuzziness: "AUTO"
            }
        });
    }


    const query = {
        index: vars.serverSetups.elastic.indices.card,
        body: {
            size: 300,
            query: {
                bool: {
                    must: mustConditions,
                    minimum_should_match: shouldConditions.length > 0 ? 1 : 0
                }
            },
            collapse: {
                field: "service_id",
                inner_hits: {
                    name: "collapse_hits",
                    size: 1000,
                    sort: [
                        {
                            national_service: {
                                order: "desc"
                            }
                        }
                    ],
                    _source: [
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
                    ]
                }
            },
            _source: [
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
            ]
        }
    };

    try {
        const response = await executeESQuery(query);
        return transformCardIdToNewFormat(response);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
