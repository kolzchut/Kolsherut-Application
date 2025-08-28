import {executeESQuery} from './es';
import buildAutoCompleteQuery from "./dsl/buildAutoCompleteQuery";
import buildAutoCompleteFromCard from "./dsl/buildAutoCompleteFromCard";

export default async (search: string) => {
    const autoCompleteQuery = buildAutoCompleteQuery(search);
    const autoCompleteFromCardQuery = buildAutoCompleteFromCard(search);

    try {
        const [autoCompleteResults, autoCompleteFromCardResults] = await Promise.all([executeESQuery(autoCompleteQuery), executeESQuery(autoCompleteFromCardQuery)]);
        return {autoCompleteResults, autoCompleteFromCardResults};
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
