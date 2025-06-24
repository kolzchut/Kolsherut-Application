import loadConfig from './loadConfig';
import ReactDOM from 'react-dom/client';
import React from "react";
import {store} from "../store/store";
import sendMessage from "./sendMessage/sendMessage";
import {setSearchOptions} from "../store/data/dataSlice";
import sortOptionalSearchValues from "./sortOptionalSearchValues";

export default async (main: React.ReactNode) => {
    await loadConfig();
    const searchOptions = await sendMessage({method: 'get', requestURL: window.config.routes.homepage})
    const sortedSearchOptions = sortOptionalSearchValues(searchOptions.data);
    if(searchOptions.success) store.dispatch(setSearchOptions(sortedSearchOptions))
    ReactDOM.createRoot(document.getElementById('root')!).render(main);
};
