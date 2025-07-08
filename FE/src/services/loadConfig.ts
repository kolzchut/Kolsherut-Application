import axios from 'axios';
import logger from "./logger/logger";
import {store} from "../store/store";
import {setPage} from "../store/general/generalSlice";


declare global {
    interface Window {
        config: any;
        strings: any;
        responseColors:any;
        filters:any;
        gtag:any;
    }
}

const configUrl = `/config.json?cacheBuster=${Date.now()}`;
const stringsUrl = `/strings.json?cacheBuster=${Date.now()}`;
const responseColorsUrl = `/responseColors.json?cacheBuster=${Date.now()}`;
const filtersUrl = `/filters.json?cacheBuster=${Date.now()}`;


export  default async () => {
    try{
        const promises = await Promise.all([
            axios.get(configUrl),
            axios.get(stringsUrl),
            axios.get(responseColorsUrl),
            axios.get(filtersUrl),
        ]);
        if(promises[0]['headers']["content-type"] !== "application/json") throw new Error("Config file is not JSON");
        if(promises[1]['headers']["content-type"] !== "application/json") throw new Error("String file is not JSON");
        if(promises[2]['headers']["content-type"] !== "application/json") throw new Error("color file is not JSON");
        if(promises[3]['headers']["content-type"] !== "application/json") throw new Error("color file is not JSON");

        window.config = promises[0].data;
        window.strings = promises[1].data;
        window.responseColors = promises[2].data;
        window.filters = promises[3].data;
        Object.freeze(window.config);
        Object.freeze(window.strings);
        Object.freeze(window.responseColors);
        Object.freeze(window.filters);
        return true;
    }catch(e){
        logger.error({message: `Error loading config `, payload: e});
        store.dispatch(setPage("maintenance"));
    }
};
