import mapAnalytics from "../../gtag/mapEvents.ts";
import {reRouteToCard} from "../../routes/reRoute.ts";
import logger from "../../logger/logger.ts";

const handleMapFeatureClick = (event: Event, cardId: string, lengthOfFeatures:number) => {
    event.preventDefault();
    if (lengthOfFeatures === 1) {
        mapAnalytics.enterServiceFromMapPopupSingleBranchEvent(cardId);
    } else {
        mapAnalytics.enterServiceFromMapPopupMultiBranchEvent(cardId);
    }
    logger.log({message: `rerouting to card:${cardId}`});
    reRouteToCard({cardId});
};

window.handleMapFeatureClick = handleMapFeatureClick;
