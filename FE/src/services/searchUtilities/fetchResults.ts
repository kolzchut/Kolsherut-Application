import sendMessage from "../sendMessage/sendMessage.ts";
import resultsAnalytics from "../gtag/resultsEvents.ts";


const getResultsFromServer = async (searchQuery: string) => {
    if (!searchQuery) return [];
    const results = await sendMessage({
        method: 'get',
        requestURL: window.config.routes.search+"/"+searchQuery
    });
    if (!results.success) return [];
    return results.data;
}

const fetchResults = async ({searchQuery="",responseId="",situationId=""}:{searchQuery?:string, responseId?:string, situationId?:string}) => {
    const fetchedResults = await getResultsFromServer(searchQuery);
    const responseCount = responseId ? 1 : 0;
    const filtersCount = responseCount + (situationId ? 1 : 0) + (searchQuery ? 1 : 0);
    resultsAnalytics.searchEvent({searchQuery, responseCount, filtersCount});
    return fetchedResults;
};
export default fetchResults;
