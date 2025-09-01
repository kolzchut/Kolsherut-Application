import {executeESQuery} from './es';
import buildInitialAutoCompleteGetFromPresets from "./dsl/buildInitialAutoCompleteGetFromPresets";
import buildGetAutoCompleteFromTitle from "./dsl/buildGetAutoCompleteFromTitles";

export default async () => {
    try {
    const initialAutoCompleteFromPresets =(await executeESQuery(buildInitialAutoCompleteGetFromPresets))?.hits.hits.map((hit: any) => hit._source);
    const titles = initialAutoCompleteFromPresets.map((item: any) => item.title);
    const autocomplete = (titles.map((title: string) => {
        return executeESQuery(buildGetAutoCompleteFromTitle(title));
    }));

    return Promise.all(autocomplete);
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};
