import { Feature } from "ol";
import { Geometry } from "ol/geom";
import Map from "ol/Map";
import MapBrowserEvent from "ol/MapBrowserEvent";
import {deletePopup} from "./popup.ts";

const onMapClickGetFeature = (
    event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>,
    ol: Map,
    onClickCB: (selectedFeature: Feature<Geometry>) => void
) => {
    let foundFeature = false;
    ol.forEachFeatureAtPixel(event.pixel, (feature) => {
        const castedFeature = feature as Feature<Geometry>;
        onClickCB(castedFeature);
        foundFeature = true;
        return true;
    });
    if(!foundFeature) deletePopup();
};

export default onMapClickGetFeature;
