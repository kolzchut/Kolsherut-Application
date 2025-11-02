import {ICard} from "../../types/cardType";

const buildContent = (card: ICard): string => {
    const contentArray = [];
    if (card.service_name) contentArray.push(card.service_name);
    if (card.organization_name_parts.primary) contentArray.push(card.organization_name_parts.primary);
    if (card.address_parts?.primary) contentArray.push(card.address_parts.primary);
    return contentArray.join(' / ');
}

const getCardMetaTags = (card: ICard) => {
    const metaTags = window.metaTags.card;
    const serviceDescription = card.service_description;
    const cardId = card.card_id;
    const serviceName = card.service_name
    const content = buildContent(card);

    const macrosAndReplacements: { [key: string]: string } = {
        '%%content%%': content,
        '%%serviceDescription%%': serviceDescription ?? '',
        '%%serviceId%%': cardId,
        '%%serviceName%%': serviceName ?? ""
    };
    return {metaTags, macrosAndReplacements}
}
export default getCardMetaTags;
