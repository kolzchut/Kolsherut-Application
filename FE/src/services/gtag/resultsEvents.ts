import analytics from "./analytics";
import {IBranch} from "../../types/serviceType";
import {store} from "../../store/store";
import {getIsLandingPage} from "../../store/general/general.selector";
import ILocation from "../../types/locationType";
import israelLocation from "../../constants/israelLocation";

interface ISearchEventProps {
    responseCount: number;
    searchQuery?: string;
    filtersCount: number;
}

interface IViewItemListEventProps {
    responsesCount: number;
    filtersCount: number;
    searchQuery?: string;
    branches: IBranch[];
    organizationName: string
}

export const searchEvent = ({responseCount, searchQuery, filtersCount}: ISearchEventProps) => {
    const isFirstPage = getIsLandingPage(store.getState());
    const eventParams = {
        search_term: searchQuery,
        filter_count: filtersCount,
        filter_responses_count: responseCount,
        landing_page: isFirstPage ? 'yes' : 'no',
    };
    analytics.logEvent({
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
    const isFirstPage = getIsLandingPage(store.getState());
    const eventParams = {
        search_term: searchQuery,
        filter_count: filtersCount,
        filter_responses_count: responsesCount,
        landing_page: isFirstPage ? 'yes' : 'no',
        items: (branches || []).map((branch, index) => {
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
    analytics.logEvent({
        event: 'view_item_list',
        params: eventParams,
    });
}
export const geoFilterLocationSelect = (location: ILocation) => {
    let kind = 'select-place';
    if (location.key == window.config.defaultLocations[0].key)
        kind = 'geo_my_location';
    if (location.key == israelLocation.key)
        kind = 'geo_nation_wide';
    analytics.logEvent({event: 'geo-widget', params: {kind, where: location.key}});
}
export const moreFiltersModalEvent = () => {
    analytics.logEvent({event:'open-filters', params: {currentPage: window.location.href}});
}
export const gotoCardFromBranchList = (cardId: string) => {
    analytics.logEvent({event: 'goto_card_from_branch_list', params: {cardId}});
}

export const onFocusOnSearchInput = () => {
    analytics.logEvent({event:'regular-searchbar-focus',params:{currentPage: window.location.href}});
}

export const scrollOnceEvent = () => {
    analytics.logEvent({
        event: 'scroll-in-results',
        params: {
            landing_page: getIsLandingPage(store.getState()) ? 'yes' : 'no'
        }
    })
}

export const quickFilterActivatedEvent = () => {
    analytics.logEvent({
        event: 'srm:quick_filter', params: {
            landing_page: getIsLandingPage(store.getState()) ? 'yes' : 'no'
        }
    })
}

export default {
    searchEvent,
    viewItemListEvent,
    geoFilterLocationSelect,
    moreFiltersModalEvent,
    gotoCardFromBranchList,
    onFocusOnSearchInput,
    scrollOnceEvent,
    quickFilterActivatedEvent
}
