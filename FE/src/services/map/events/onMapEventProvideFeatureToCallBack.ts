import {Feature} from "ol";
import {Geometry} from "ol/geom";
import Map from "ol/Map";
import MapBrowserEvent from "ol/MapBrowserEvent";
import {deleteMainPopup, deleteSecondaryPopup, isPopupLocked, unlockPopup} from "./popup.ts";

const onMapEventProvideFeatureToCallBack = (
    event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>,
    ol: Map,
    onClickCB: (selectedFeature: Feature<Geometry>, lockedPopup: boolean) => void,
    onClickPopUp: boolean
) => {
    let foundFeature = false;
    if (isPopupLocked() && !onClickPopUp) return;
    ol.forEachFeatureAtPixel(event.pixel, (feature) => {
        const castedFeature = feature as Feature<Geometry>;
        onClickCB(castedFeature, onClickPopUp);
        foundFeature = true;
        return true;
    });
    if (!foundFeature && !onClickPopUp) {
        unlockPopup();
        deleteSecondaryPopup();
    }
    if (!foundFeature && onClickPopUp) {
        unlockPopup();
        deleteMainPopup();
    }
};

export default onMapEventProvideFeatureToCallBack;
