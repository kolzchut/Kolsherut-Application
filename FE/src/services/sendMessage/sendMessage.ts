import axios, {AxiosRequestConfig} from 'axios';
import logger from "../logger/logger";

const globals = {
    isGoingToReloadWindow: false
}

const getBaseURL = (): string => {
    return window.config.URLS.server;
};

const authenticationRequired = () =>{
    if(globals.isGoingToReloadWindow || !window.config.reloadWhenNotAuthenticated) return;
    logger.log({
        message:   window.strings.authenticationRequired.header,
        payload: window.strings.authenticationRequired.message
    })
    globals.isGoingToReloadWindow = true;
    setTimeout(()=>window.location.reload(), window.config.reloadTimeIfNotAuthenticated)
}

const getHeaders = (): Record<string, string> => {
    return { Authorization: `Bearer ${window.bearer || ''}` };
};

const createRequestConfig = (method: string, body: object): AxiosRequestConfig => {
    const headers = getHeaders();
    const validateStatus = (status: number) => {
        return status === 403 || (status >= 200 && status < 300);
    };
    return method === 'get' || method === 'delete'
        ? { headers, validateStatus }
        : { headers, data: body, validateStatus };
};

const sendMessage = async ({method,requestURL='',body={}}:{method: 'get' | 'post' | 'delete' | 'put' | 'patch' , requestURL?:string, body?: any}
) => {
    try {
        if(globals.isGoingToReloadWindow) return;
        const baseURL = getBaseURL();
        const config = createRequestConfig(method, body);
        const response = await axios.request({
            method,
            url: baseURL + requestURL,
            ...config,
        });
        if(response.status === 403) {
            authenticationRequired();
            return;
        }
        return response.data;
    } catch (error) {
        logger.error({message:`Error in request to - ${requestURL} `, payload:error});
        return { error };
    }
};

export default sendMessage;
