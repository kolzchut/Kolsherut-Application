import {Feature} from "ol";
import {Geometry, Point} from "ol/geom";
import {MapBrowserEvent} from "ol";
import map, {MapSingleton} from "../map";
import buildPopupContent from "../style/PopupContent/PopupContent";

const globals = {
    popUpLocked: false,
}

const createPopupOverlay = (
    popupOverlay: {
        setOffset: (offset: [number, number]) => void;
        setPosition: (coords: number[] | undefined) => void;
        getElement: () => HTMLElement | undefined
    },
    feature: Feature<Geometry>,
    contentElement: HTMLDivElement
) => {
    const geometry = feature.getGeometry();
    if (geometry instanceof Point) {
        const coords = geometry.getCoordinates();

        contentElement.innerHTML = buildPopupContent({feature, root: contentElement});

        const popupEl = popupOverlay.getElement();
        if (popupEl && !popupEl.contains(contentElement)) {
            popupEl.innerHTML = '';
            popupEl.appendChild(contentElement);
        }
        popupOverlay.setOffset([0, 52]);
        popupOverlay.setPosition(coords);
    } else {
        deletePopupOverlay(popupOverlay);
    }
};

const deletePopupOverlay = (
    popupOverlay: { setPosition: (coords: number[] | undefined) => void }
) => {
    popupOverlay.setPosition(undefined);
};

export const createHoverPopupHandler = (map: MapSingleton) => {
    return (event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>) => {
        if(globals.popUpLocked) return;
        const popupOverlay = map.getPopupOverlay?.();
        if (!popupOverlay) return;
        const feature = map.ol.forEachFeatureAtPixel(event.pixel, (f) => f as Feature<Geometry>);
        if (feature) {
            const contentElement = document.createElement("div") as HTMLDivElement;
            createPopupOverlay(popupOverlay, feature, contentElement);
        } else {
            deletePopupOverlay(popupOverlay);
        }
    };
};

export const createPopupByCardId = ({cardId}: { cardId: string }) => {
    if (!map.layers || !map.layers[1]?.getSource()) return;
    const source = map.layers[1].getSource();
    if (!source) return;
    const feature = source.getFeatures().find(f => f.getProperties().cardId === cardId);
    if (!feature) return;
    const popupOverlay = map.getPopupOverlay?.();
    if (!popupOverlay) return;
    const contentElement = document.createElement("div") as HTMLDivElement;
    createPopupOverlay(popupOverlay, feature, contentElement);
}

export const deletePopup = () =>{
    const popupOverlay = map.getPopupOverlay?.();
    if (!popupOverlay) return;
    deletePopupOverlay(popupOverlay);
}

export const lockPopup = () => {
    globals.popUpLocked = true;
};
export const unlockPopup = () => {
    globals.popUpLocked = false;
};
