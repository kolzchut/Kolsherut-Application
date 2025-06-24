import loadConfig from './loadConfig';
import ReactDOM from 'react-dom/client';
import React from "react";
import {store} from "../store/store";
import sendMessage from "./sendMessage/sendMessage";
import {setRouteParams} from "../store/general/generalSlice";
import {setSearchOptions} from "../store/data/dataSlice";
import sortOptionalSearchValues from "./sortOptionalSearchValues";
import mapService from './map/map'
import {mapInteractions, viewInteractions} from "./map/mapInteraction";
import {getRouteParams} from "./route";


export default async (main: React.ReactNode) => {
    const routeParams = getRouteParams();
    store.dispatch(setRouteParams(routeParams));
    await loadConfig();
    mapService.init({mapInteractions, viewInteractions})
    const searchOptions = await sendMessage({method: 'get', requestURL: window.config.routes.homepage})
    const sortedSearchOptions = sortOptionalSearchValues(searchOptions.data);
    if (searchOptions.success) store.dispatch(setSearchOptions(sortedSearchOptions))
    ReactDOM.createRoot(document.getElementById('root')!).render(main);
};
