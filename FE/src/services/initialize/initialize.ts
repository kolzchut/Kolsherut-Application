import loadConfig from './loadConfig';
import ReactDOM from 'react-dom/client';
import React from "react";
import {getRouteParams} from "../route.tsx";
import {store} from "../../store/store.ts";
import {setRouteParams} from "../../store/general/generalSlice.ts";

export default async (main: React.ReactNode) => {
    const routeParams = getRouteParams();
    store.dispatch(setRouteParams(routeParams));
    await loadConfig();
    ReactDOM.createRoot(document.getElementById('root')!).render(main);
};
