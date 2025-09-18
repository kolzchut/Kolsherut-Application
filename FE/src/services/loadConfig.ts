import axios from 'axios';
import logger from "./logger/logger";
import {store} from "../store/store";
import {setPage} from "../store/general/generalSlice";
import {IGroup} from "../types/homepageType";

declare global {
    interface Window {
        config: any;
        strings: any;
        responseColors: any;
        filters: any;
        homepage: Array<IGroup>;
        gtag: any;
        modules: any;
        metaTags: any
        environment: any;
        dataLayer: any;
        handleMapFeatureClick: (event: Event, cardId: string, lengthOfFeatures: number) => void;
        __suppressHistoryPush: boolean
    }
}

type ConfigType = { type: keyof Window, fileName: string };

const configs: Array<ConfigType> = [
    {"type": "environment", fileName: "environment.json"},
    {"type": "config", "fileName": `config.json`},
    {"type": "strings", "fileName": `strings.json`},
    {"type": "responseColors", "fileName": `responseColors.json`},
    {"type": "filters", "fileName": `filters.json`},
    {"type": "modules", "fileName": `modules.json`},
    {"type": "metaTags", "fileName": `metaTags.json`}
];

export default async () => {
    try {
        const promises = await Promise.all(
            configs.map(async config => axios.get(`/configs/${config.fileName}?cacheBuster=${Date.now()}`))
        );

        configs.forEach((config: ConfigType, index: number) => {
            if (promises[index]['headers']["content-type"] !== "application/json") throw new Error(`${config.type} file is not JSON`);
            (window[config.type] as unknown) = promises[index].data;
            Object.freeze(window[config.type]);
        });
        if (window.environment.state !== "production") logger.log({message:`Running on ${window.environment.state} environment`, payload:window.environment});
        return true;
    } catch (e) {
        logger.error({message: `Error loading config `, payload: e});
        store.dispatch(setPage("maintenance"));
    }
};
