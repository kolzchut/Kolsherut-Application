import loadConfig from './loadConfig';
import ReactDOM from 'react-dom/client';
import React from "react";
import {store} from "../store/store";
import {setRouteParams} from "../store/general/generalSlice";
import mapService from './map/map'
import {mapInteractions, viewInteractions} from "./map/events/mapInteraction";
import {getRouteParams} from "./url/route";
import  {setAllLocationsInStore} from "./geoLogic";
import analytics from "./gtag/analytics";
import {setFilterRouteParams} from "../store/filter/filterSlice";


const routeParamsToStore = (routeParams: Record<string, string>) => {
    store.dispatch(setRouteParams(routeParams));
    store.dispatch(setFilterRouteParams(routeParams));
};

const handlePopState = (event: { state: any }) => {
    if (!event.state) return;
    routeParamsToStore(event.state);
};
export default async (main: React.ReactNode) => {
    const routeParams = getRouteParams();
    if(routeParams) routeParamsToStore(routeParams);

    if(await loadConfig()) {
        analytics.init();
        mapService.init({mapInteractions, viewInteractions})
        setAllLocationsInStore();
    }

    window.addEventListener('popstate', handlePopState);
    ReactDOM.createRoot(document.getElementById('root')!).render(main);
};
