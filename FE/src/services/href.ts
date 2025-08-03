import ILocation from "../types/locationType.ts";
import israelLocation from "../constants/israelLocation.ts";
import {stringifyLocation} from "./url/parseURL.ts";

export const getHrefForCard = (cardId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?p=card&c=${cardId}`;
}

export const getHrefForResults = ({
                                      searchQuery = "",
                                      situationFilter = [],
                                      responseFilter = [],
                                      location = israelLocation
                                  }: {
    searchQuery?: string,
    location?: ILocation,
    situationFilter?: string[],
    responseFilter?: string[]
}) => {
    const baseUrl = window.location.origin;
    const queryParams = new URLSearchParams({p: 'results'});
    const searchQueryToSet = searchQuery.trim() || responseFilter.join(',') || situationFilter.join(',') || location.key;
    queryParams.set('sq', searchQueryToSet);
    if (location) {
        const locationString = stringifyLocation(location);
        if (locationString) {
            queryParams.set('lf', locationString);
        }
    }
    queryParams.set('sf', JSON.stringify(situationFilter));
    queryParams.set('rf', JSON.stringify(responseFilter));
    return `${baseUrl}/?${queryParams.toString()}`;
};
