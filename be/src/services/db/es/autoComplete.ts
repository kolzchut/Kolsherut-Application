import {executeESQuery} from './es';
import vars from "../../../vars";

export default async (search: string) => {
    const query = {
        index: vars.serverSetups.elastic.indices.autocomplete,
        body: {
            size: 5,
            query: {
                bool: {
                    must: {
                        match: {
                            query: {
                                query: search,
                                fuzziness: "AUTO"
                            }
                        }
                    }
                }
            },
        }
    };

    try {
        return await executeESQuery(query);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
