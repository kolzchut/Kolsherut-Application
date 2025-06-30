import axios from 'axios';
import logger from "./logger/logger.ts";
import {store} from "../store/store.ts";
import {setPage} from "../store/general/generalSlice.ts";


declare global {
    interface Window {
        config: any;
        strings: any;
        responseColors:any;
        gtag:any;
    }
}

const configUrl = `/config.json?cacheBuster=${Date.now()}`;
const stringsUrl = `/strings.json?cacheBuster=${Date.now()}`;
const responseColorsUrl = `/responseColors.json?cacheBuster=${Date.now()}`;

export  default async () => {
    try{
        const promises = await Promise.all([
            axios.get(configUrl),
            axios.get(stringsUrl),
            axios.get(responseColorsUrl),
        ]);
        if(promises[0]['headers']["content-type"] !== "application/json") throw new Error("Config file is not JSON");
        if(promises[1]['headers']["content-type"] !== "application/json") throw new Error("String file is not JSON");
        if(promises[2]['headers']["content-type"] !== "application/json") throw new Error("color file is not JSON");

        window.config = promises[0].data;
        window.strings = promises[1].data;
        window.responseColors = promises[2].data;
        Object.freeze(window.config);
        Object.freeze(window.strings);
        Object.freeze(window.responseColors);
        return true;
    }catch(e){
        logger.error({message: `Error loading config `, payload: e});
        store.dispatch(setPage("maintenance"));
    }
};
