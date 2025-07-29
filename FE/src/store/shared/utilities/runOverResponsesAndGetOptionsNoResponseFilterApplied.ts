import {Response} from "../../../types/cardType";
import IFilterOptions from "../../../types/filterOptions";

export const runOverResponsesAndGetOptionsNoResponseFilterApplied = (responses: Response[]) => {
    const options: IFilterOptions = {};
    responses.forEach((response: Response) => {
        if (!response.id) return;
        else if (!options[response.id]) {
            options[response.id] = {count: 1, name: response.name};
        } else {
            options[response.id].count = Number(options[response.id].count) + 1;
        }
    });
    return options;
}
