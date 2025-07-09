import {executeESQuery} from './es';
import vars from "../../../vars";

export default async () => {
    const query = {
        index: vars.serverSetups.elastic.indices.locations,
        body: {
            size: 10000,
            query: {
                match_all:{}
            },
            _source: ['key', 'bounds'],
        }
    };

    try {
        return await executeESQuery(query);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
