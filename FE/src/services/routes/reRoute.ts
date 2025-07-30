import { setCardIdAndCardPage } from "../../store/general/generalSlice";
import {store} from "../../store/store";

export const reRouteToCard = ({cardId}: { cardId: string }) => {
    store.dispatch(setCardIdAndCardPage(cardId));
}
