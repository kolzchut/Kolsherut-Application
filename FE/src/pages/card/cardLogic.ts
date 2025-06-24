import sendMessage from "../../services/sendMessage/sendMessage";

export const getFullCard = async(cardId:string) => {
    const requestURL = window.config.routes.card.replace('%%cardId%%', cardId);
    const response = await sendMessage({method:'get', requestURL})
    return response.success ? response.data : null;
}
