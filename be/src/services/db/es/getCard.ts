import {executeESQuery} from './es';
import logger from "../../logger/logger";
import buildGetMainCardQuery from "./dsl/buildGetMainCardQuery";
import buildGetRelatedCardsQuery from "./dsl/buildGetRelatedCardsQuery";
import { mainCardSourceFields } from "./sourceFields/mainCardSourceFields";
import { relatedCardsSourceFields } from "./sourceFields/relatedCardsSourceFields";

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
    const mainCardQuery = buildGetMainCardQuery({cardId, mainCardSourceFields});

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

        const relatedCardsQuery = buildGetRelatedCardsQuery({cardId, collapseSourceFields: relatedCardsSourceFields, branchKey});

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
