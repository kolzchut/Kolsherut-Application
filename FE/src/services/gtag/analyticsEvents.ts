import {ICard} from "../../types/cardType";
import {GtagItem, LogEventArgs} from "../../types/gTagTypes";


const logEvent = ({event, params}: LogEventArgs) => {

    // return;
    const url = window.location.href;
    const analyticsId = 'G-SSW46Z8STP';
    window.gtag('event', event, {
        send_to: analyticsId,
        url,
        ...params,
    });
};


export const cardEvent = (
    card: ICard,
    index: number,
    select: boolean,
    from: string | null = null
) => {
    if (select) {
        logEvent({
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

        logEvent({
            event: 'srm:card',
            params: eventParams,
        });
        logEvent({
            event: 'view_item',
            params: {
                ...eventParams,
                items: [cardToItem(card, index)],
            },
        });

        interactionEvent('card', from || 'unknown', undefined);
    }
};

const cardToItem = (card: ICard, idx: number, item_list_name?: string | null) => {
    const address = card.address_parts
        ? card.address_parts.primary + (card.address_parts.secondary ? ', ' + card.address_parts.secondary : '')
        : card.branch_address;

    const categories: string[] = [];
    card.responses.slice(0, 2).forEach(response => response.id && categories.push(response.id));
    card.situations.slice(0, 3).forEach(situation => situation.id && categories.push(situation.id));

    const item_name = card.service_name?.replace(/"/g, '');
    const item_brand = card.organization_name.replace(/"/g, '');
    const item_variant = address.replace(/"/g, '');

    const item: GtagItem = {item_name, item_brand, item_variant, item_list_name: item_list_name || ''};
    if (idx > 0) item.index = idx;
    if (item_list_name) item.item_list_name = item_list_name;

    categories.forEach((category, index) => {
        item[`item_category${index + 1}`] = category;
    });

    return item;
};

const interactionEvent = (what: string, where: string, content?: string) => {
    const event = {
        event: 'srm:interaction',
        interaction_where: where,
        interaction_what: what,
        interaction_content: content || null,
    };
    logEvent({event: event.event, params: event});
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
    logEvent({
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

    logEvent({
        event: 'card_action',
        params: eventParams,
    });
};

export const executeAddToCartAndCardAction = ({card, action, action_url}:{ card: ICard, action: 'email' | 'phone' | 'url' | 'nav', action_url: string }
) => {
    console.log('executeAddToCartAndCardAction', card, action, action_url);
    addToCartEvent(card, action, action_url);
    cardActionEvent(card, action, action_url);
};

export const extendDescriptionEvent = (cardId: string) => {
    logEvent({
        event: 'srm:extend_description',
        params: {cardId},
    });
}
