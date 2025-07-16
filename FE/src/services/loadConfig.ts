import axios from 'axios';
import logger from "./logger/logger";
import {store} from "../store/store";
import {setPage} from "../store/general/generalSlice";
import {IGroup} from "../types/homepageType";

declare global {
    interface Window {
        config: any;
        strings: any;
        responseColors:any;
        filters:any;
        homepage:Array<IGroup>;
        gtag:any;
        modules:any;
    }
}

type ConfigType = { type: keyof Window, fileName: string };

const configs:Array<ConfigType> = [
    {"type":"config","fileName": `config.json`},
    {"type":"strings","fileName": `strings.json`},
    {"type":"responseColors","fileName": `responseColors.json`},
    {"type":"filters","fileName": `filters.json`},
    {"type":"modules","fileName": `modules.json`},
];

export  default async () => {
    try{
        const promises = await Promise.all(
            configs.map(async config => axios.get(`/configs/${config.fileName}?cacheBuster=${Date.now()}`))
        );

        configs.forEach((config:ConfigType, index:number) => {
            if(promises[index]['headers']["content-type"] !== "application/json") throw new Error(`${config.type} file is not JSON`);
            (window[config.type] as unknown) =  promises[index].data;
            Object.freeze(window[config.type]);
        });
        return true;
    }catch(e){
        logger.error({message: `Error loading config `, payload: e});
        store.dispatch(setPage("maintenance"));
    }
};
