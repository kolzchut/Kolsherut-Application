import { Feature } from "ol";
import { Geometry, Point } from "ol/geom";
import { MapBrowserEvent } from "ol";
import { MapSingleton } from "../map";
import buildPopupContent from "../style/PopupContent/PopupContent";


export const createHoverPopupHandler = (map: MapSingleton) => {
    const contentElement = document.createElement("div");
    return (event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>) => {
        const popupOverlay = map.getPopupOverlay?.();
        if (!popupOverlay) return;

        const feature = map.ol.forEachFeatureAtPixel(event.pixel, (f) => f as Feature<Geometry>);
        if (feature) {
            const geometry = feature.getGeometry();
            if (geometry instanceof Point) {
                const coords = geometry.getCoordinates();

                contentElement.innerHTML = buildPopupContent({feature, root: contentElement});

                const popupEl = popupOverlay.getElement();
                if (popupEl && !popupEl.contains(contentElement)) {
                    popupEl.innerHTML = '';
                    popupEl.appendChild(contentElement);
                }
                popupOverlay.setOffset([0, 37]);
                popupOverlay.setPosition(coords);
            } else {
                popupOverlay.setPosition(undefined);
            }
        } else {
            popupOverlay.setPosition(undefined);
        }
    };
};
