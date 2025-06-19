import sendMessage from "../../services/sendMessage/sendMessage";
import {ICard} from "../../types/cardType";
import {store} from "../../store/store";
import {setPage} from "../../store/general/generalSlice";
import {goToXy} from "../../services/map/view";
import {removeAllPOIs, addPOI} from "../../services/map/poiInteraction";
import PoiData from "../../types/poiData";

export const getFullCard = async (cardId: string) => {
    const requestURL = window.config.routes.card.replace(':cardId', cardId);
    const response = await sendMessage({method: 'get', requestURL})
    const card: ICard = response.data;
    return response.success ? card : null;
}

export const setMapToCard = (card:ICard) =>{
    if(!card || !card.branch_geometry) return;
    const {branch_geometry} = card;
    goToXy(branch_geometry);
    removeAllPOIs();
    console.log('card ', card)
    const poiData: PoiData = {
        branch_geometry,
        responses: card.responses,
        situations: card.situations,
        cardId: card.card_id
    }
    addPOI(poiData)
}

export const backToHome = () => store.dispatch(setPage("home"))
