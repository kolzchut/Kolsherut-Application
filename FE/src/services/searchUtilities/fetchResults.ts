import sendMessage from "../sendMessage/sendMessage.ts";
import resultsAnalytics from "../gtag/resultsEvents.ts";


const getResultsFromServer = async (
    searchQuery: string,
    isFast: boolean,
    responseId: string,
    situationId: string,
    by: string,
) => {
    if (!searchQuery) return [];
    const results = await sendMessage({
        method: 'post',
        requestURL: window.config.routes.search,
        body: {
            searchQuery,
            isFast,
            responseId,
            situationId,
            by,
        }
    });
    if (!results.success) return [];
    return results.data;
}

const fetchResults = async ({
    searchQuery = "",
    responseId = "",
    situationId = "",
    by = "",
    isFast,
}: {
    searchQuery?: string,
    responseId?: string,
    situationId?: string,
    by?: string,
    isFast: boolean,
}) => {
    const fetchedResults = await getResultsFromServer(searchQuery, isFast, responseId, situationId, by);
    const responseCount = responseId ? 1 : 0;
    const filtersCount = responseCount + (situationId ? 1 : 0) + (searchQuery ? 1 : 0);
    resultsAnalytics.searchEvent({searchQuery, responseCount, filtersCount});
    return fetchedResults;
};
export default fetchResults;
