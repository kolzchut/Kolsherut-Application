import analytics from "./analytics.ts";


const searchFromSearchAutocomplete = (query: string) => {
    analytics.logEvent({params: {query}, event: 'search-autocomplete'});
};
const enterCardFromSearchAutocomplete = (cardId: string) => {
    analytics.logEvent({params: {cardId}, event: 'search-autocomplete-direct'});
}


export default {
    searchFromSearchAutocomplete,
    enterCardFromSearchAutocomplete
}

