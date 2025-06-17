import {executeESQuery} from './es';
import vars from "../../../vars";

export default async () => {
    const query = {
        index: vars.serverSetups.elastic.indices.homepage,
        body: {
            size: 1000,
    }
    };

    try {
        return await executeESQuery(query);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
