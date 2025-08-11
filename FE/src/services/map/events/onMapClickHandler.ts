import {Feature} from "ol";
import {Geometry} from "ol/geom";
import mapAnalytics from "../../gtag/mapEvents.ts";
import {createPopupByFeatureForBranchServices, lockPopup, unlockPopup} from "./popup.ts";
import {isMobileScreen} from "../../media.ts";
import {store} from "../../../store/store.ts";
import {setSelectedFeatureId} from "../../../store/general/generalSlice.ts";

const onMapClickHandler = (selectedFeature: Feature<Geometry>, onClickPopUp: boolean) => {
    const featureProperties = selectedFeature.getProperties();
    mapAnalytics.onMapBranchClicked({
        cardId: featureProperties.cardId,
        branchName: featureProperties.name || 'סניף ללא שם'
    });
    if (isMobileScreen()) return store.dispatch(setSelectedFeatureId(selectedFeature.getId()));
    if(onClickPopUp) unlockPopup()
    createPopupByFeatureForBranchServices(selectedFeature, onClickPopUp);
    if(onClickPopUp) lockPopup();
}
export default onMapClickHandler
