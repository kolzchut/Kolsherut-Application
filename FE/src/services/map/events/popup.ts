import {Feature} from "ol";
import {Geometry, Point} from "ol/geom";
import map from "../map";
import cardPopUp from "../style/PopupContent/cardPopUp/cardPopup.ts";
import branchServicesPopup from "../style/PopupContent/branchServicesPopup/branchServicesPopup.ts";
import branchSummaryPopup from "../style/PopupContent/branchSummaryPopup/branchSummaryPopup.ts";
import addPopupInteractionGuards from "../utils/popupInteractionGuards";

const globals = {
    popUpLocked: false,
    currentMainPopupId: "" as string | number
}
export const isPopupLocked = () => globals.popUpLocked;

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
        const interactiveEl = popupEl?.querySelector('.summary-popup-content, .branch-services-content');
        if (interactiveEl instanceof HTMLElement) {
            addPopupInteractionGuards(interactiveEl);
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
    const popupOverlay = map.getMainPopupOverlay();
    if (!popupOverlay) return;
    const contentElement = document.createElement("div") as HTMLDivElement;
    createPopupOverlay(popupOverlay, feature, contentElement, cardPopUp);
}

export const createPopupByFeatureForBranchServices = (feature: Feature<Geometry>, isOnClickPopup: boolean) => {
    if (globals.popUpLocked) return;
    const popupOverlay = isOnClickPopup ? map.getMainPopupOverlay() : map.getSecondaryPopupOverlay();
    const isIntendingToHoverOnClickedPopUp = !isOnClickPopup && feature.getId() === globals.currentMainPopupId;

    if (!popupOverlay || isIntendingToHoverOnClickedPopUp) return;

    globals.currentMainPopupId = feature.getId() || "";
    const contentElement = document.createElement("div") as HTMLDivElement;

    if (isOnClickPopup || feature.getProperties().features.length < 2) createPopupOverlay(popupOverlay, feature, contentElement, branchServicesPopup);
    else createPopupOverlay(popupOverlay, feature, contentElement, branchSummaryPopup);

    if(isOnClickPopup) deleteSecondaryPopup()
}

export const deleteMainPopup = () => {
    const popupOverlay = map.getMainPopupOverlay();
    if (!popupOverlay) return;
    deletePopupOverlay(popupOverlay);
}
export const deleteSecondaryPopup = () => {
    const popupOverlay = map.getSecondaryPopupOverlay();
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
    const main = map.getMainPopupOverlay();
    if (main) main.setOffset([-475, 0]);
    const secondary = map.getSecondaryPopupOverlay();
    if (secondary) secondary.setOffset([-475, 0]);
}
export const setPopupOffsetForSmallMap = () => {
    const main = map.getMainPopupOverlay();
    if (main) main.setOffset([0, 0]);
    const secondary = map.getSecondaryPopupOverlay();
    if (secondary) secondary.setOffset([0, 0]);
}
