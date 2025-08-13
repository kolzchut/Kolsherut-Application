import {IBranch} from "../../../types/serviceType";
import IFilterOptions from "../../../types/filterOptions";

export const addSelectedResponseToResult = (
    result: IFilterOptions,
    responseId: string,
    allBranches: IBranch[]
): void => {
    const responsesArray = allBranches.flatMap(branch => branch.responses);
    const selectedResponse = responsesArray.find(response => response.id === responseId);

    if (selectedResponse) {
        result[responseId] = {
            count: 0,
            name: selectedResponse.name,
            type: 'response'
        };
    }
};
