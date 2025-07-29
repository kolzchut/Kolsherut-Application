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
    analytics.logEvent({
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
    analytics.interactionEvent('geo-widget', where, location.key);
}
export const moreFiltersModalEvent = () => {
    analytics.interactionEvent('open-filters', window.location.href);
}
export const gotoCardFromBranchList = (cardId: string) => {
    analytics.interactionEvent(cardId, 'branch-services');
}

export const onFocusOnSearchInput = () => {
    analytics.interactionEvent('regular-searchbar', window.location.href);
}

export const scrollOnceEvent = () => {
    analytics.interactionEvent('scroll-in-results', window.location.href);
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

