import IFilterOptions from "../../../types/filterOptions";
import {IBranch} from "../../../types/serviceType";
import {addSelectedSituationToResult} from "./addSelectedSituationToResult";

export const addMissingSelectedSituations = (
    result: IFilterOptions,
    selectedSituationIds: string[],
    allBranches: IBranch[]
): void => {
    selectedSituationIds.forEach(selectedSituationId => {
        if (!result[selectedSituationId]) {
            addSelectedSituationToResult(result, selectedSituationId, allBranches);
        }
    });
};
