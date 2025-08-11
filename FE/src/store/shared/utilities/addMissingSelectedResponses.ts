import IFilterOptions from "../../../types/filterOptions";
import {IBranch} from "../../../types/serviceType";
import {addSelectedResponseToResult} from "./addSelectedResponseToResult";

export const addMissingSelectedResponses = (
    result: IFilterOptions,
    selectedResponseIds: string[],
    allBranches: IBranch[]
): void => {
    selectedResponseIds.forEach(selectedResponseId => {
        if (!result[selectedResponseId]) {
            addSelectedResponseToResult(result, selectedResponseId, allBranches);
        }
    });
};
