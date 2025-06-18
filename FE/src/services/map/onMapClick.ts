import { Feature } from "ol";
import { Geometry } from "ol/geom";
import Map from "ol/Map";
import MapBrowserEvent from "ol/MapBrowserEvent";

const onMapClick = (
    event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>,
    ol: Map,
    onClickCB: (selectedFeature: Feature<Geometry>) => void
) => {
    ol.forEachFeatureAtPixel(event.pixel, (feature) => {
        const castedFeature = feature as Feature<Geometry>;
        onClickCB(castedFeature);
    });
};

export default onMapClick;
