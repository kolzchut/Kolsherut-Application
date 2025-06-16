import {Client} from '@elastic/elasticsearch';
import vars from "../../../vars";
import logger from "../../logger/logger";

let client: Client | null = null;

const getESClient = () => {
    if (!client) {
        logger.warning({service: "DB", message: "Making new elasticsearch client out of init process"});
        client = new Client(vars.serverSetups.elastic.connection);
    }
    return client;
}

const ESInit = async () => {
    if (!client) client = new Client(vars.serverSetups.elastic.connection);
    try {
        const health = await client.cluster.health();
        logger.log({service: "DB", message: 'Elasticsearch cluster health', payload: health});
    } catch (error) {
        logger.error({service: "DB", message: 'Error connecting to Elasticsearch:', payload: error});
        setTimeout(()=>ESInit(),vars.serverSetups.elastic.reconnectTimeout);
    }
};
const executeESQuery = async (query: object) => {
    const esClient = getESClient();
    try {
        return await esClient.search(query);
    } catch (error) {
        logger.error({service: "DB", message: 'Error executing Elasticsearch query:', payload: error});
        throw error;
    }
}

export {ESInit, getESClient, executeESQuery};
