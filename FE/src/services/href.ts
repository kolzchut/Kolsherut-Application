import {buildUrl} from "./url/route.tsx";

export const getHrefForCard = (cardId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/p/card/c/${cardId}`;
}

export const getHrefForResults = ({
                                      searchQuery,
                                      situationFilter,
                                      responseFilter,
                                  }: {
    searchQuery?: string,
    situationFilter?: string,
    responseFilter?: string
}) => {
    return buildUrl({
        p: 'results',
        ...(searchQuery ? {sq: searchQuery} : {}),
        ...(situationFilter ? {brf: situationFilter} : {}),
        ...(responseFilter ? {bsf: responseFilter} : {})

    })
};
