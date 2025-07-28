import analytics from "./analytics";

export const mapStateEvent = ({isOpen}: { isOpen: boolean }) => {
    analytics.logEvent({
        params: { map_state: isOpen ? 'open' : 'close'},
        event: 'map_state',

    });
}

export const enterServiceFromMapPopupHoverEvent = (cardId: string) => {
    analytics.interactionEvent(cardId, 'map-popup-hover');
};

export const enterServiceFromMapPopupSingleBranchEvent = (cardId: string) => {
    analytics.interactionEvent(cardId, 'map-popup-single-branch');
};

export const enterServiceFromMapPopupMultiBranchEvent = (cardId: string) => {
    analytics.interactionEvent(cardId, 'map-popup-multi-branch');
};

export const enterServiceFromPointViewMobileEvent = (cardId: string) => {
    analytics.interactionEvent(cardId, 'point-view');
};

export const mapElementClickEvent = (layerId: string) => {
    analytics.interactionEvent('point-click', 'map', layerId);
};

export const mapDragEvent = (zoomLevel: number) => {
    analytics.interactionEvent('map-drag', 'map', Math.round(zoomLevel).toString());
};

export const mapClickEvent = (zoomLevel: number) => {
    analytics.interactionEvent('map-click', 'map', Math.round(zoomLevel).toString());
};

export const placeNameClickEvent = (placeName: string) => {
    analytics.interactionEvent('place-name-click', 'map', placeName);
};

export const popupCardClickFromHoverEvent = (cardId: string) => {
    analytics.interactionEvent('popup-card-click', 'map-popup-hover', cardId);
};

export const popupCardClickFromStableEvent = (cardId: string) => {
    analytics.interactionEvent('popup-card-click', 'map-popup-stable', cardId);
};
