import sendMessage from "../sendMessage/sendMessage.ts";
import resultsAnalytics from "../gtag/resultsEvents.ts";


const getResultsFromServer = async (searchQuery: string, isFast:boolean) => {
    if (!searchQuery) return [];
    const isFastURL = isFast ? "fast" : "rest"
    const results = await sendMessage({
        method: 'get',
        requestURL: window.config.routes.search+"/"+searchQuery+"/"+isFastURL,
    });
    if (!results.success) return [];
    return results.data;
}

const fetchResults = async ({searchQuery="",responseId="",situationId="", isFast}:{searchQuery?:string, responseId?:string, situationId?:string, isFast:boolean}) => {
    const fetchedResults = await getResultsFromServer(searchQuery, isFast);
    const responseCount = responseId ? 1 : 0;
    const filtersCount = responseCount + (situationId ? 1 : 0) + (searchQuery ? 1 : 0);
    resultsAnalytics.searchEvent({searchQuery, responseCount, filtersCount});
    return fetchedResults;
};
export default fetchResults;
