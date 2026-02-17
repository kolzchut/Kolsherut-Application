import ReactGA from "react-ga4";
import { LogEventArgs } from "../../types/gTagTypes";
import logger from "../logger/logger";
import {store} from "../../store/store";
import {getIsLandingPage} from "../../store/general/general.selector";

let isInitialized = false;

const init = () => {
    if (navigator.userAgent.includes("KolsherutBot")) return;
    const analyticsId = window.environment.analyticsId;
    ReactGA.initialize(analyticsId, {
        gtagOptions: {
            cookie_flags: "SameSite=None;Secure",
        }
    });
    isInitialized = true;
    logger.log({ message: `Initializing Google Analytics on ${analyticsId}` });
};

const logEvent = ({ event, params }: LogEventArgs) => {
    if (!isInitialized) return;
    ReactGA.event(event, {
        ...params
    });
};

const interactionEvent = (what: string, where: string, content?: string) => {
    const params = {
        interaction_where: where,
        interaction_what: what,
        interaction_content: content || null,
    };
    logEvent({ event: 'srm:interaction', params });
};


const getIsLandingPageAsString = (): string => {
    return getIsLandingPage(store.getState()) ? 'yes' : 'no';
}

const onPageView = (page: string) => {
    if (!isInitialized) return;
    const isLanding = getIsLandingPageAsString();

    ReactGA.send({
        hitType: "pageview",
        page,
        is_landing_page: isLanding
    });
};

export default {
    init,
    logEvent,
    interactionEvent,
    onPageView,
    getIsLandingPageAsString
}
