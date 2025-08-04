import analytics from "./analytics";

export const mapStateEvent = ({isOpen}: { isOpen: boolean }) => {
    analytics.logEvent({
        params: {map_state: isOpen ? 'open' : 'close'},
        event: 'map_state',

    });
}
export const onMapBranchClicked = ({cardId, branchName}: { cardId: string, branchName: string }) => {
    analytics.interactionEvent('map-branch-clicked', cardId, branchName);
}

export const enterServiceFromMapPopupSingleBranchEvent = (cardId: string) => {
    analytics.interactionEvent(cardId, 'map-popup-single-branch');
};

export const enterServiceFromMapPopupMultiBranchEvent = (cardId: string) => {
    analytics.interactionEvent(cardId, 'map-popup-multi-branch');
};

export const mapDragEvent = (zoomLevel: number) => {
    analytics.interactionEvent('map-drag', 'map', Math.round(zoomLevel).toString());
};


export default {
    mapStateEvent,
    onMapBranchClicked,
    enterServiceFromMapPopupSingleBranchEvent,
    enterServiceFromMapPopupMultiBranchEvent,
    mapDragEvent,
}
