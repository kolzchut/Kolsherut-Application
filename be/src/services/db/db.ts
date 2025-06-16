import {getESClient as getDefaultClient, ESInit as getDefaultInit} from "./es/es";

const getClient = () => getDefaultClient();

const init = async () => getDefaultInit();

export { init, getClient };
