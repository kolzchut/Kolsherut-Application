import {Feature} from "ol";
import {Geometry, Point} from "ol/geom";
import map from "../map";
import cardPopUp from "../style/PopupContent/cardPopUp/cardPopup.ts";
import branchServicesPopup from "../style/PopupContent/branchServicesPopup/branchServicesPopup.ts";

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
    contentElement: HTMLDivElement,
    popUpCreator: ({feature, root}: { feature: Feature<Geometry>, root: HTMLDivElement }) => string
) => {
    const geometry = feature.getGeometry();
    if (geometry instanceof Point) {
        const coords = geometry.getCoordinates();

        contentElement.innerHTML = popUpCreator({feature, root: contentElement});

        const popupEl = popupOverlay.getElement();
        if (popupEl && !popupEl.contains(contentElement)) {
            popupEl.innerHTML = '';
            popupEl.appendChild(contentElement);
        }
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

export const createPopupByCardIdForCard = ({cardId}: { cardId: string }) => {
    if (!map.layers || !map.layers[1]?.getSource() || globals.popUpLocked) return;
    const source = map.layers[1].getSource();
    if (!source) return;
    const feature = source.getFeatures().find(f => f.getProperties().cardId === cardId);
    if (!feature) return;
    const popupOverlay = map.getPopupOverlay();
    if (!popupOverlay) return;
    const contentElement = document.createElement("div") as HTMLDivElement;
    createPopupOverlay(popupOverlay, feature, contentElement, cardPopUp);
}

export const createPopupByFeatureForBranchServices = (feature: Feature<Geometry>) => {
    if(globals.popUpLocked) return;
    const popupOverlay = map.getPopupOverlay();
    if (!popupOverlay) return;
    const contentElement = document.createElement("div") as HTMLDivElement;
    createPopupOverlay(popupOverlay, feature, contentElement, branchServicesPopup);
}

export const deletePopup = () => {
    const popupOverlay = map.getPopupOverlay();
    if (!popupOverlay) return;
    deletePopupOverlay(popupOverlay);
}

export const lockPopup = () => {
    globals.popUpLocked = true;
};
export const unlockPopup = () => {
    globals.popUpLocked = false;
};
    export const setPopupOffsetForBigMap = () => {
    const popupOverlay = map.getPopupOverlay();
    if (!popupOverlay) return;
    popupOverlay.setOffset([-475, 0]);
}
export const setPopupOffsetForSmallMap = () => {
    const popupOverlay = map.getPopupOverlay();
    if (!popupOverlay) return;
    popupOverlay.setOffset([0, 0]);
}
