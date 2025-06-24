const logEvent = ({event, params}) => {
    //TODO: remove in production. this return is only so we don't log events in development
    return;
    const url = window.location.href;
    window.gtag({
        event,
        url,
        ...params
    });
}

export const extendDescriptionEvent = (cardId: string) => {
    logEvent({
        event: 'srm:extend_description',
        params: {cardId},
    });
}
