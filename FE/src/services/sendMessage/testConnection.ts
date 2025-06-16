import sendMessage from "./sendMessage.ts";
import {store} from "../../store/store.ts";
import {setConnected, setDisconnected} from "../../store/general/generalSlice.ts";
import logger from "../logger/logger.ts";

const setConnection = (isConnected: boolean) => isConnected ? setConnected() : setDisconnected();

export default async () => {
    const response = await sendMessage({method: 'get', requestURL: window.config.routes.test})
    store.dispatch(setConnection(response.success));
    logger.log({message: `response`, payload: response});

}