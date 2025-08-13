import {IBranch} from "../../../types/serviceType.ts";
import {checkBranchPassesFilters} from "./checkBranchPassesFilters.ts";

export const countRemovedBranches = (
    allBranches: IBranch[],
    filteredBranchIds: Set<string>,
    itemId: string,
    currentFilters: { responses: string[], situations: string[] },
    itemType: 'response' | 'situation'
): number => {
    let count = 0;
    const simulatedResponseFilters = itemType === 'response'
        ? [...currentFilters.responses, itemId]
        : currentFilters.responses;
    const simulatedSituationFilters = itemType === 'situation'
        ? [...currentFilters.situations, itemId]
        : currentFilters.situations;

    allBranches.forEach(branch => {
        if (!filteredBranchIds.has(branch.id)) return;

        if (!checkBranchPassesFilters(branch, simulatedResponseFilters, simulatedSituationFilters)) {
            count++;
        }
    });

    return count;
};
