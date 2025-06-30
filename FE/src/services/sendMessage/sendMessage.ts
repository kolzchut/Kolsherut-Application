import axios from 'axios';
import logger from "../logger/logger";
import SendMessageType from "../../types/sendMessageType";
import {store} from "../../store/store.ts";
import {setPage} from "../../store/general/generalSlice.ts";


const getBaseURL = (): string => {
    return window.config.URLS.server;
};


const sendMessage =
    async ({method, requestURL = '', body = {}}: SendMessageType) => {
    try {
        const baseURL = getBaseURL();
        const response = await axios.request({
            method,
            url: baseURL + requestURL,
            data: body,
        });
        return response.data;
    } catch (error) {
        logger.error({message: `Error in request to - ${requestURL} `, payload: error});
        store.dispatch(setPage("maintenance"));
        return {error};
    }
};

export default sendMessage;
