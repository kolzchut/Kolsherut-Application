import {Response} from "../../types/cardType";

export const getLinkToCard = (cardId: string) =>{
    const macro = window.config.redirects.macro;
    return window.config.redirects.linkToCard.replace(macro, cardId);
}
export const isEmergency = (responses: Response[])=>{
    const emergencyConditions = window.config.emergencyConditionsByResponseId;
    return responses.some(response => emergencyConditions.includes(response.id));
}
