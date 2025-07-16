import {interactionEvent, logEvent} from "./analytics";

export const mapState = ({isOpen}: { isOpen: boolean }) => {
    logEvent({
        params: { map_state: isOpen ? 'open' : 'close'},
        event: 'map_state',

    });
}

export const mapPointClick = () => {
    interactionEvent('point-click', 'map', 'points-stroke-on')
}
