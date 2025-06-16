import { executeESQuery } from './es';
import vars from "../../../vars";

export default async (serviceName?: string, responseId?: string, situationId?: string) => {
    const mustConditions = [];
    const filterConditions = [];

    if (serviceName) {
        mustConditions.push({
            match: {
                service_name: {
                    query: serviceName,
                    fuzziness: "AUTO"
                }
            }
        });
    }

    if (responseId) {
        filterConditions.push({
            term: {
                "responses.id": responseId
            }
        });
    }

    if (situationId) {
        filterConditions.push({
            term: {
                "situations.id": situationId
            }
        });
    }

    const query = {
        index: vars.serverSetups.elastic.indices.card,
        body: {
            size: 30,
            query: {
                bool: {
                    must: mustConditions,
                    filter: filterConditions
                }
            },
            collapse: {
                field: "collapse_key",
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
        return await executeESQuery(query);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
