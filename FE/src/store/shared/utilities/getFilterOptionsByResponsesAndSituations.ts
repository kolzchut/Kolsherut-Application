import {Response, Situation} from "../../../types/cardType";
import IFilterOptions from "../../../types/filterOptions";

export const getFilterOptionsByResponsesAndSituations = ({responses, situations}: {
    responses: Response[],
    situations: Situation[]
}) => {
    const options: IFilterOptions = {};

    responses.forEach((response: Response) => {
        if (!response.id) return;
        else if (!options[response.id]) {
            options[response.id] = {count: 1, name: response.name, type: 'response'};
        } else {
            options[response.id].count = Number(options[response.id].count) + 1;
        }
    });
    situations.forEach((situation: Situation) => {
        if (!situation.id) return;
        else if (!options[situation.id]) {
            options[situation.id] = {count: 1, name: situation.name, type: 'situation'};
        } else {
            options[situation.id].count = Number(options[situation.id].count) + 1;
        }
    });

    return options;
}
