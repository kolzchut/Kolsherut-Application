import {IBranch} from "../../../types/serviceType";
import IFilterOptions from "../../../types/filterOptions";

export const addSelectedSituationToResult = (
    result: IFilterOptions,
    situationId: string,
    allBranches: IBranch[]
): void => {
    const situationsArray = allBranches.flatMap(branch => branch.situations);
    const selectedSituation = situationsArray.find(situation => situation.id === situationId);

    if (selectedSituation) {
        result[situationId] = {
            count: 0,
            name: selectedSituation.name,
            type: 'situation'
        };
    }
};
