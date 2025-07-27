import {executeESQuery} from './es';
import vars from "../../../vars";
import logger from "../../logger/logger";

interface CardSource {
    card_id: string;
    branch_key?: string;
    [key: string]: any;
}

interface EnrichedCardSource extends CardSource {
    servicesInSameBranch: CardSource[];
}


interface ElasticsearchHit<T> {
    _source: T;
}

interface ElasticsearchResponse<T> {
    hits: {
        total: {
            value: number;
        };
        hits: ElasticsearchHit<T>[];
    };
}


export default async (cardId: string): Promise<EnrichedCardSource | null> => {
    const mainCardSourceFields = [
        "branch_key",
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
    ];

    const mainCardQuery = {
        index: vars.serverSetups.elastic.indices.card,
        body: {
            size: 1,
            query: {
                term: {
                    card_id: cardId
                }
            },
            _source: mainCardSourceFields
        }
    };

    try {
        const mainCardResponse = await executeESQuery(mainCardQuery) as ElasticsearchResponse<CardSource>;

        if (!mainCardResponse.hits.hits.length) {
            logger.warning({service: "Get Card", message: `Card with ID ${cardId} not found.`});
            return null;
        }

        const mainCardData = mainCardResponse.hits.hits[0]._source;
        const branchKey = mainCardData.branch_key;

        if (!branchKey) {
            logger.warning({service: "Get Card", message: `Card with ID ${cardId} does not have a branch_key.`});
            return {
                ...mainCardData,
                servicesInSameBranch: []
            };
        }

        const collapseSourceFields = [
            "card_id",
            "situations",
            "responses",
            "service_description",
            "service_name",
        ];

        const relatedCardsQuery = {
            index: vars.serverSetups.elastic.indices.card,
            body: {
                size: 10,
                query: {
                    bool: {
                        must: [
                            {term: {"branch_key": branchKey}}
                        ],
                        must_not: [
                            {term: {"card_id": cardId}}
                        ]
                    }
                },
                _source: collapseSourceFields
            }
        };

        const relatedCardsResponse = await executeESQuery(relatedCardsQuery) as ElasticsearchResponse<CardSource>;
        const servicesInSameBranch = relatedCardsResponse.hits.hits.map(hit => hit._source);
        return {
            ...mainCardData,
            servicesInSameBranch: servicesInSameBranch
        };

    } catch (error) {
        console.error('Error executing card enrichment query:', error);
        throw error;
    }
};
