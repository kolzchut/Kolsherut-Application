import {Response} from "../../types/cardType";

export const isEmergency = (responses: Response[])=>{
    const emergencyConditions = window.config.emergencyConditionsByResponseId;
    return responses.some(response => emergencyConditions.includes(response.id));
}
