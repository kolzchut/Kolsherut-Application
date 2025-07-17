import loadConfig from './loadConfig';
import ReactDOM from 'react-dom/client';
import React from "react";
import {store} from "../store/store";
import sendMessage from "./sendMessage/sendMessage";
import {setRouteParams} from "../store/general/generalSlice";
import {setSearchOptions} from "../store/data/dataSlice";
import sortOptionalSearchValues from "./sortOptionalSearchValues";
import mapService from './map/map'
import {mapInteractions, viewInteractions} from "./map/events/mapInteraction";
import {getRouteParams} from "./url/route.tsx";
import  {setAllLocationsInStore} from "./geoLogic";
import analytics from "./gtag/analytics";
import {setFilterRouteParams} from "../store/filter/filterSlice.ts";


export default async (main: React.ReactNode) => {
    const routeParams = getRouteParams();
    if(routeParams) {
        store.dispatch(setRouteParams(routeParams));
        store.dispatch(setFilterRouteParams(routeParams));
    }
    if (await loadConfig()) {
        mapService.init({mapInteractions, viewInteractions})
        setAllLocationsInStore();
        const searchOptions = await sendMessage({method: 'get', requestURL: window.config.routes.homepage})
        const sortedSearchOptions = sortOptionalSearchValues(searchOptions.data || []);
        if (searchOptions.success) store.dispatch(setSearchOptions(sortedSearchOptions))
    }
    analytics.init();
    ReactDOM.createRoot(document.getElementById('root')!).render(main);
};
