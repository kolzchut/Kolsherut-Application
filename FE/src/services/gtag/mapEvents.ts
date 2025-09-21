import analytics from "./analytics";

export const mapStateEvent = ({isOpen}: { isOpen: boolean }) => {
    analytics.logEvent({
        params: {map_state: isOpen ? 'open' : 'close'},
        event: 'map_state',

    });
}
export const onMapBranchClicked = ({cardId, branchName}: { cardId: string, branchName: string }) => {
    analytics.logEvent({
        event: 'map-branch-clicked',
        params: {
            cardId,
            branchName
        }
    });
}

export const enterServiceFromMapPopupSingleBranchEvent = (cardId: string) => {
    analytics.logEvent({params: {cardId}, event: 'map-popup-single-branch'});
};

export const enterServiceFromMapPopupMultiBranchEvent = (cardId: string) => {
    analytics.logEvent({params: {cardId}, event: 'map-popup-multi-branch'});
};

export const mapDragEvent = (zoomLevel: number) => {
    analytics.logEvent({event: 'map-drag', params: {zoomLevel: Math.round(zoomLevel).toString()}});
};


export default {
    mapStateEvent,
    onMapBranchClicked,
    enterServiceFromMapPopupSingleBranchEvent,
    enterServiceFromMapPopupMultiBranchEvent,
    mapDragEvent,
}
