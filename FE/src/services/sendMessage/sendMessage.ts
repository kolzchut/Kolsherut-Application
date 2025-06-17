import axios from 'axios';
import logger from "../logger/logger";
import SendMessageType from "../../types/sendMessageType";


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
        return {error};
    }
};

export default sendMessage;
