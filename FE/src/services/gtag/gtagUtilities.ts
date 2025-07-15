import {ICard} from "../../types/cardType";
import {GtagItem} from "../../types/gTagTypes";

export const cardToItem = (card: ICard, idx: number, item_list_name?: string | null) => {
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

export const isLandingPage = () => window.location.href === document.referrer || document.referrer === '';
