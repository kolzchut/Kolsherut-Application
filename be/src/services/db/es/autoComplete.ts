import {executeESQuery} from './es';
import buildAutoCompleteQuery from "./dsl/buildAutoCompleteQuery";

export default async (search: string) => {
    const query = buildAutoCompleteQuery(search);
    try {
        return await executeESQuery(query);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
