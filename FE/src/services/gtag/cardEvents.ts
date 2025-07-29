import {ICard} from "../../types/cardType";
import analytics from "./analytics";
import {cardToItem} from "./gtagUtilities";

const cardEvent = (
    card: ICard,
    index: number,
    select: boolean,
    from: string | null = null
) => {
    if (select) {
        analytics.logEvent({
            event: 'select_item',
            params: {
                ecommerce: {
                    items: [cardToItem(card, index)],
                },
            },
        });
    } else {
        const eventParams = {
            card_id: card.card_id,
            card_name: card.service_name,
            card_org: card.organization_id,
        };
        analytics.logEvent({
            event: 'srm:card',
            params: eventParams,
        });
        analytics.logEvent({
            event: 'view_item',
            params: {
                ...eventParams,
                items: [cardToItem(card, index)],
            },
        });
        analytics.interactionEvent('card', from || 'unknown', undefined);
    }
};

const addToCartEvent = (card: ICard, action: string, action_url: string) => {
    const eventParams = {
        action_type: action,
        action_url: action_url,
        card_id: card.card_id,
        card_name: card.service_name,
        card_org: card.organization_id,
        cta_action: action,
        landing_page: 'no',
        items: [cardToItem(card, 0)],
    };
    analytics.logEvent({
        event: 'add_to_cart',
        params: {
            conversion: true,
            ...eventParams,
        },
    });
};

const cardActionEvent = (card: ICard, action: string, action_url: string) => {
    const eventParams = {
        action_type: action,
        action_url: action_url,
        card_id: card.card_id,
        card_name: card.service_name,
        card_org: card.organization_id,
        landing_page: 'no',
    };
    analytics.logEvent({
        event: 'card_action',
        params: eventParams,
    });
};

const copyToClipboard = ({card, action, action_url}: {
                             card: ICard,
                             action: 'email' | 'phone' | 'url' | 'nav',
                             action_url: string
                         }
) => {
    addToCartEvent(card, action, action_url);
    cardActionEvent(card, action, action_url);
};

const extendDescriptionEvent = (card_id: string) => {
    analytics.logEvent({
        event: 'srm:extend_description',
        params: {card_id},
    });
};

const shrinkDescriptionEvent = (card_id: string) => {
    analytics.logEvent({
        event: 'srm:shrink_description',
        params: {card_id},
    });
};

export default {
    cardEvent,
    addToCartEvent,
    cardActionEvent,
    copyToClipboard,
    extendDescriptionEvent,
    shrinkDescriptionEvent,
}
