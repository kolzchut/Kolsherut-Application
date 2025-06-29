import {LogEventArgs} from "../../types/gTagTypes";
import EnvironmentEnum from "../../types/environmentEnum";


export const logEvent = ({event, params}: LogEventArgs) => {
    if (window.config.environment !== EnvironmentEnum.Production) return;
    const url = window.location.href;
    const analyticsId = 'G-SSW46Z8STP';
    window.gtag('event', event, {
        send_to: analyticsId,
        url,
        ...params,
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
