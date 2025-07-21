import {ICard} from "../../types/cardType.ts";

const getCardMetaTags = (card:ICard)=>{
    const metaTags = window.metaTags.card;
    const serviceName = card.service_name || 'שירות ללא שם';
    const serviceDescription = card.service_description;
    const cardId = card.card_id;

    const macrosAndReplacements: { [key: string]: string } = {
        '%%serviceName%%': serviceName,
        '%%serviceDescription%%': serviceDescription ?? '',
        '%%serviceId%%': cardId
    };
    return {metaTags, macrosAndReplacements}
}
export default getCardMetaTags;
