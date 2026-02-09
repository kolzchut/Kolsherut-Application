import sendMessage from "../sendMessage/sendMessage";
import resultsAnalytics from "../gtag/resultsEvents";


const getResultsFromServer = async (
    searchQuery: string,
    isFast: boolean,
    responseId: string,
    situationId: string,
    by: string,
    serviceName: string
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
            serviceName
        }
    });
    if (!results?.success) return [];
    return results.data;
}

const fetchResults = async ({
    searchQuery = "",
    responseId = "",
    situationId = "",
    by = "",
    serviceName = "",
    isFast,
}: {
    searchQuery?: string,
    responseId?: string,
    situationId?: string,
    by?: string,
    serviceName?: string,
    isFast: boolean,
}) => {
    const fetchedResults = await getResultsFromServer(searchQuery, isFast, responseId, situationId, by, serviceName);
    const responseCount = responseId ? 1 : 0;
    const filtersCount = responseCount + (situationId ? 1 : 0) + (searchQuery ? 1 : 0);
    resultsAnalytics.searchEvent({searchQuery, responseCount, filtersCount});
    return fetchedResults;
};
export default fetchResults;
