import mapAnalytics from "../../gtag/mapEvents.ts";
import {reRouteToCard} from "../../routes/reRoute.ts";

const handleMapFeatureClick = (event: Event, cardId: string, lengthOfFeatures:number) => {
    event.preventDefault();
    if (lengthOfFeatures === 1) {
        mapAnalytics.enterServiceFromMapPopupSingleBranchEvent(cardId);
    } else {
        mapAnalytics.enterServiceFromMapPopupMultiBranchEvent(cardId);
    }
    reRouteToCard({cardId});
};
(window as any).handleMapFeatureClick = handleMapFeatureClick;
