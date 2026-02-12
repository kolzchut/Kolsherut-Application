import loadConfig from './loadConfig';
import ReactDOM from 'react-dom/client'; // Import hydrateRoot is usually implicit, but good to check
import { hydrateRoot } from 'react-dom/client'; // <--- ADD THIS
import React from "react";
import { store } from "../store/store";
import { setRouteParams } from "../store/general/generalSlice";
import mapService from './map/map'
import { mapInteractions, viewInteractions } from "./map/events/mapInteraction";
import { getRouteParams } from "./url/route";
import { setAllLocationsInStore } from "./geoLogic";
import analytics from "./gtag/analytics";
import { setFilterRouteParams } from "../store/filter/filterSlice";
import hotjar from "./hotjar/hotjar";

const routeParamsToStore = (routeParams: Record<string, string>) => {
    store.dispatch(setRouteParams(routeParams));
    store.dispatch(setFilterRouteParams(routeParams));
};

const hydrateFromLocation = () => {
    window.__suppressHistoryPush = true;
    const currentParams = getRouteParams();
    routeParamsToStore(currentParams);
    setTimeout(() => { window.__suppressHistoryPush = false; }, 0);
};

const handlePopState = () => {
    hydrateFromLocation();
};

export default async (main: React.ReactNode) => {
    hydrateFromLocation();

    if (await loadConfig()) {
        analytics.init();
        mapService.init({ mapInteractions, viewInteractions });
        setAllLocationsInStore();
        hotjar.init();
    }

    const container = document.getElementById('root')!;
    const hasStaticContent = container.childElementCount > 0;

    if (hasStaticContent) {
        hydrateRoot(container, main);
    } else {
        ReactDOM.createRoot(container).render(main);
    }

    window.addEventListener('popstate', handlePopState);
};
