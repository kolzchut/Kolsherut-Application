import {interactionEvent, logEvent} from "./analytics";
import {IBranch} from "../../types/serviceType";
import {isLandingPage} from "./gtagUtilities";
import ILocation from "../../types/locationType.ts";
import israelLocation from "../../constants/israelLocation.ts";

interface ISearchEventProps {
    responseCount: number;
    searchQuery: string;
    filtersCount: number;
}

interface IViewItemListEventProps {
    responsesCount: number;
    filtersCount: number;
    searchQuery: string;
    branches: IBranch[];
    organizationName: string
}

export const searchEvent = ({responseCount, searchQuery, filtersCount}: ISearchEventProps) => {
    const isFirstPage =isLandingPage();
    const eventParams = {
        search_term: searchQuery,
        filter_count: filtersCount,
        filter_responses_count: responseCount,
        landing_page: isFirstPage ? 'yes' : 'no',
    };
    logEvent({
        event: 'search',
        params: eventParams,
    });
}

export const viewItemListEvent = ({
                                      responsesCount,
                                      filtersCount,
                                      organizationName,
                                      searchQuery,
                                      branches
                                  }: IViewItemListEventProps) => {
    const isFirstPage = isLandingPage();
    const eventParams = {
        search_term: searchQuery,
        filter_count: filtersCount,
        filter_responses_count: responsesCount,
        landing_page: isFirstPage ? 'yes' : 'no',
        items: branches.map((branch, index) => {
            const itemCategories: { [key: string]: string } = {}
            const arrOfCategories = [...branch.responses, ...branch.situations].map((category) => category.id)
            arrOfCategories.forEach((category, idx) => {
                if (category) itemCategories[`item_category${idx + 1}`] = category;
            });
            return ({
                item_name: branch.name,
                item_brand: organizationName,
                item_variant: branch.isNational ? "שירות ארצי" : branch.address,
                index: index,
                ...itemCategories
            })

        })
    };
    logEvent({
        event: 'view_item_list',
        params: eventParams,
    });
}
export const geoFilterLocationSelect = (location: ILocation) => {
    let where = 'select-place';
    if (location.key == window.config.defaultLocations[0].key)
        where = 'geo_my_location';
    if (location.key == israelLocation.key)
        where = 'geo_nation_wide';
    interactionEvent('geo-widget', where, location.key);
}
export const moreFiltersModalEvent = () =>{
    interactionEvent('open-filters', window.location.href);
}
export const gotoCardFromBranchList = (cardId:string) =>{
    interactionEvent(cardId, 'branch-services');
}

export const scrollOnceEvent = () =>{
    interactionEvent('scroll-in-results', window.location.href);
}


