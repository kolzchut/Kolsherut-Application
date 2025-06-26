import {executeESQuery} from './es';
import vars from "../../../vars";

export default async (cardId: string) => {
    const query = {
        index: vars.serverSetups.elastic.indices.card,
        body: {
            size: 1,
            query: {
                term: {
                    card_id: cardId
                }
            },
            _source: [
                "service_details",
                "service_description",
                "service_payment_details",
                "service_urls",
                "service_phone_numbers",
                "service_email_address",
                "service_implements",
                "organization_id",
                "organization_name",
                "organization_short_name",
                "organization_purpose",
                "organization_kind",
                "organization_urls",
                "organization_phone_numbers",
                "organization_email_address",
                "organization_branch_count",
                "branch_name",
                "service_name",
                "branch_operating_unit",
                "branch_description",
                "branch_urls",
                "branch_phone_numbers",
                "branch_email_address",
                "branch_address",
                "branch_location_accurate",
                "branch_city",
                "branch_geometry",
                "national_service",
                "organization_name_parts",
                "data_sources",
                "card_id",
                "situations",
                "situation_ids",
                "responses",
                "point_id",
                "address_parts"
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
