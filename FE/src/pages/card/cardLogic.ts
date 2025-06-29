import sendMessage from "../../services/sendMessage/sendMessage";
import {ICard} from "../../types/cardType";
import {store} from "../../store/store";
import {setPage} from "../../store/general/generalSlice";
import {goToXy} from "../../services/map/view";
import {addPOI} from "../../services/map/poiInteraction";
import PoiData from "../../types/poiData";

export const getFullCard = async(cardId:string) => {
    const requestURL = window.config.routes.card.replace('%%cardId%%', cardId);
    const response = await sendMessage({method:'get', requestURL})
    return response.success ? response.data : null;
}

export const setMapToCard = (card:ICard) =>{
    if(!card || !card.branch_geometry) return;
    const {branch_geometry} = card;
    goToXy(branch_geometry);
    const poiData: PoiData = {
        branch_geometry,
        responses: card.responses,
        situations: card.situations,
        cardId: card.card_id,
        branch_address: card.branch_address,
        branch_city: card.branch_city,
        branch_name: card.branch_name || card.organization_name,
        accurateLocation: card.branch_location_accurate
    }
    addPOI(poiData)
}

export const backToHome = () => store.dispatch(setPage("home"))
