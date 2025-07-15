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
        modules:any;
    }
}

type ConfigType = { type: string, fileName: string };

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

        configs.map((config, index)=>{
            if(promises[index]['headers']["content-type"] !== "application/json") throw new Error(`${config.type} file is not JSON`);
        })
        configs.map((config:ConfigType, index:number) => {
            window[config.type] =  promises[index].data;
            Object.freeze(window[config.type]);
        });
        return true;
    }catch(e){
        logger.error({message: `Error loading config `, payload: e});
        store.dispatch(setPage("maintenance"));
    }
};
