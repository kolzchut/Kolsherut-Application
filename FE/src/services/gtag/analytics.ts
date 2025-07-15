import ReactGA from "react-ga4";
import {LogEventArgs} from "../../types/gTagTypes";
import EnvironmentEnum from "../../enums/environmentEnum";
import logger from "../logger/logger";


const init = ()=>{
    ReactGA.initialize(window.config.analytics.id);
    logger.log({message:'Initializing Google Analytics'});
}

export const logEvent = ({event, params}: LogEventArgs) => {
    if (window.config.environment !== EnvironmentEnum.Production) return;
    const url = window.location.href;
    ReactGA.event(event, {
        url,
        ...params
    });
};

export const interactionEvent = (what: string, where: string, content?: string) => {
    const event = {
        event: 'srm:interaction',
        interaction_where: where,
        interaction_what: what,
        interaction_content: content || null,
    };
    logEvent({event: event.event, params: event});
};

export default {
    init,
    logEvent,
    interactionEvent,
}
