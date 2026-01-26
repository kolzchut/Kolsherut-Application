import ReactGA from "react-ga4";
import { LogEventArgs } from "../../types/gTagTypes";
import logger from "../logger/logger";

// Arbitrary name for our storage flag
const SESSION_FLAG_KEY = 'analytics_session_has_started';

const init = () => {
    const analyticsId = window.environment.analyticsId;
    ReactGA.initialize(analyticsId, {
        gtagOptions: {
            cookie_flags: "SameSite=None;Secure",
        }
    });
    logger.log({ message: `Initializing Google Analytics on ${analyticsId}` });
};

const logEvent = ({ event, params }: LogEventArgs) => {
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

const getIsLandingPage = (): boolean => {
    try {
        if (typeof window === 'undefined') return false;

        const hasStarted = sessionStorage.getItem(SESSION_FLAG_KEY);

        if (!hasStarted) {
            sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
            return true;
        }

        return false;
    } catch (error) {
        logger.log({message:"Error checking landing page status", payload:error});
        return false;
    }
};

const getIsLandingPageAsString = (): string => {
    return getIsLandingPage() ? 'yes' : 'no';
}

const onPageView = (page: string) => {
    const isLanding = getIsLandingPage();

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
