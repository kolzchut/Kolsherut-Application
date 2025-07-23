import {interactionEvent, logEvent} from "./analytics";

export const mapStateEvent = ({isOpen}: { isOpen: boolean }) => {
    logEvent({
        params: { map_state: isOpen ? 'open' : 'close'},
        event: 'map_state',

    });
}

export const enterServiceFromMapPopupHoverEvent = (cardId: string) => {
    interactionEvent(cardId, 'map-popup-hover');
};

export const enterServiceFromMapPopupSingleBranchEvent = (cardId: string) => {
    interactionEvent(cardId, 'map-popup-single-branch');
};

export const enterServiceFromMapPopupMultiBranchEvent = (cardId: string) => {
    interactionEvent(cardId, 'map-popup-multi-branch');
};

export const enterServiceFromPointViewMobileEvent = (cardId: string) => {
    interactionEvent(cardId, 'point-view');
};

export const mapElementClickEvent = (layerId: string) => {
    interactionEvent('point-click', 'map', layerId);
};

export const mapDragEvent = (zoomLevel: number) => {
    interactionEvent('map-drag', 'map', Math.round(zoomLevel).toString());
};

export const mapClickEvent = (zoomLevel: number) => {
    interactionEvent('map-click', 'map', Math.round(zoomLevel).toString());
};

export const placeNameClickEvent = (placeName: string) => {
    interactionEvent('place-name-click', 'map', placeName);
};

export const popupCardClickFromHoverEvent = (cardId: string) => {
    interactionEvent('popup-card-click', 'map-popup-hover', cardId);
};

export const popupCardClickFromStableEvent = (cardId: string) => {
    interactionEvent('popup-card-click', 'map-popup-stable', cardId);
};
