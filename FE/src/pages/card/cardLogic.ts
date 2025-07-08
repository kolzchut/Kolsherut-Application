import sendMessage from "../../services/sendMessage/sendMessage";
import {ICard} from "../../types/cardType";
import {store} from "../../store/store";
import {setViewPort} from "../../services/map/view";
import {addPOI, removeAllPOIs} from "../../services/map/poiInteraction";
import PoiData from "../../types/poiData";
import map from "../../services/map/map";
import {createPopupByCardId, deletePopup, lockPopup, unlockPopup} from "../../services/map/events/popup";
import {setPage} from "../../store/general/generalSlice";

export const getFullCard = async(cardId:string) => {
    const requestURL = window.config.routes.card.replace('%%cardId%%', cardId);
    const response = await sendMessage({method:'get', requestURL})
    return response.success ? response.data : null;
}

export const setMapToNationalService = () =>{
    map.disableMovement(true);
    map.showNotification(window.strings.map.serviceGivenNationWide);
    setViewPort({});
}
export const removeMapNationalService = () =>{
    map.disableMovement(false);
    map.removeNotification();
    setViewPort({});
}

export const setMapToCard = (card:ICard) =>{
    if(!card) return;
    if(card.national_service) return setMapToNationalService();
    if(!card.branch_geometry) return;
    const {branch_geometry} = card;
    setViewPort({center:branch_geometry, zoom:12});
    const poiData: PoiData = {
        branch_geometry,
        responses: card.responses,
        situations: card.situations,
        cardId: card.card_id,
        branch_address: card.branch_address,
        branch_name: card.branch_name || card.organization_name,
        accurateLocation: card.branch_location_accurate
    }
    addPOI(poiData)
}

export const backToHome = () => store.dispatch(setPage("home"))


export const setCardOnMap = (cardData:ICard) =>{
    setMapToCard(cardData)
    createPopupByCardId({cardId: cardData.card_id});
    lockPopup();
}
export const setMapBackToDefault = () =>{
    removeMapNationalService();
    removeAllPOIs()
    unlockPopup();
    deletePopup();
}
