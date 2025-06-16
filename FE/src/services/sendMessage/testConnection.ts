import sendMessage from "./sendMessage";
import {store} from "../../store/store";
import {setConnected, setDisconnected} from "../../store/general/generalSlice";
import logger from "../logger/logger";

const setConnection = (isConnected: boolean) => isConnected ? setConnected() : setDisconnected();

export default async () => {
    const response = await sendMessage({method: 'get', requestURL: window.config.routes.test})
    store.dispatch(setConnection(response.success));
    logger.log({message: `response`, payload: response});

}