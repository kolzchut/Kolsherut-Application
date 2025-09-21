import {Feature} from "ol";
import {Geometry} from "ol/geom";
import mapAnalytics from "../../gtag/mapEvents.ts";
import {createPopupByFeatureForBranchServices} from "./popup.ts";
import {isMobileScreen} from "../../media.ts";
import {store} from "../../../store/store.ts";
import {setSelectedFeatureId} from "../../../store/general/generalSlice.ts";
import {reRouteToCard} from "../../routes/reRoute.ts";

const onMapClickHandler = (selectedFeature: Feature<Geometry>, onClickPopUp: boolean) => {
    const featuresProperties = selectedFeature.getProperties();
    const firstFeatureProperty = featuresProperties.features[0]?.getProperties();
    if (onClickPopUp) {
        mapAnalytics.onMapBranchClicked({
            cardId: firstFeatureProperty.cardId,
            branchName: firstFeatureProperty.branch_name || 'סניף ללא שם'
        });
    }
    if (isMobileScreen()) return store.dispatch(setSelectedFeatureId(selectedFeature.getId()));
    if (featuresProperties.features.length < 2 && onClickPopUp) {
        const cardId = firstFeatureProperty.cardId;
        mapAnalytics.enterServiceFromMapPopupSingleBranchEvent(cardId);
        return reRouteToCard({cardId});
    }

    createPopupByFeatureForBranchServices(selectedFeature, onClickPopUp);
}
export default onMapClickHandler
