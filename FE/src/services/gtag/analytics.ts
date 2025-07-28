import ReactGA from "react-ga4";
import {LogEventArgs} from "../../types/gTagTypes";
import EnvironmentEnum from "../../enums/environmentEnum";
import logger from "../logger/logger";


const init = ()=>{
    const analyticsId = window.config.environment === EnvironmentEnum.Production ? window.config.analytics.id : window.config.analytics.testId;
    ReactGA.initialize(analyticsId);
    logger.log({message:`Initializing Google Analytics on ${analyticsId}`});
}

const logEvent = ({event, params}: LogEventArgs) => {
    const url = window.location.href;
    ReactGA.event(event, {
        url,
        ...params
    });
};

const interactionEvent = (what: string, where: string, content?: string) => {
    const event = {
        event: 'srm:interaction',
        interaction_where: where,
        interaction_what: what,
        interaction_content: content || null,
    };
    logEvent({event: event.event, params: event});
};

const onPageView = (page:string) => ReactGA.send({ hitType: "pageview", page});

export default {
    init,
    logEvent,
    interactionEvent,
    onPageView,
}
