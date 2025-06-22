import { Feature } from "ol";
import { Geometry, Point } from "ol/geom";
import { MapBrowserEvent } from "ol";
import { MapSingleton } from "../map";
import PoiData from "../../../types/poiData";

const buildPopupContent = (feature: Feature<Geometry>): string => {
    if (!feature) return '';
    const props = feature.getProperties() as PoiData;
    return `
    <div>
      <strong>${props.branch_name}</strong>
      <span>${props.branch_city} , ${props.branch_address}</span>
    </div>
  `;
};

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

                contentElement.innerHTML = buildPopupContent(feature);

                const popupEl = popupOverlay.getElement();
                if (popupEl && !popupEl.contains(contentElement)) {
                    popupEl.innerHTML = '';
                    popupEl.appendChild(contentElement);
                }

                popupOverlay.setPosition(coords);
            } else {
                popupOverlay.setPosition(undefined);
            }
        } else {
            popupOverlay.setPosition(undefined);
        }
    };
};
