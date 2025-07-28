import {IBranch} from "../../../types/serviceType.ts";
import {checkBranchPassesFilters} from "./checkBranchPassesFilters.ts";

export const countAdditionalBranches = (
    allBranches: IBranch[],
    filteredBranchIds: Set<string>,
    responseId: string,
    currentFilters: { responses: string[], situations: string[] }
): number => {
    let count = 0;
    const simulatedResponseFilters = [...currentFilters.responses, responseId];

    allBranches.forEach(branch => {
        if (filteredBranchIds.has(branch.id)) return;

        if (checkBranchPassesFilters(branch, simulatedResponseFilters, currentFilters.situations)) {
            count++;
        }
    });

    return count;
};
