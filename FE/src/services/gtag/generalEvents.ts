import analytics from "./analytics.ts";

const internalSearchClickedEvent = ({query, where}:{query: string, where: string}) => {
    analytics.logEvent({
        event: 'srm:interaction',

        params: {
            interaction_what: 'regular-searchbar',
            search_term: query,
            interaction_where: where
        }
    });
}

const enterServiceFromSearchAutocomplete = (query: string) => {
    analytics.interactionEvent(query, 'search-autocomplete-direct');
};

export default {
    internalSearchClickedEvent,
    enterServiceFromSearchAutocomplete
}

