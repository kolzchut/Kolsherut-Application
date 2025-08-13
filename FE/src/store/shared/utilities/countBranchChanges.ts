import {IBranch} from "../../../types/serviceType.ts";
import {countAdditionalBranches} from "./countAdditionalBranches.ts";
import {countRemovedBranches} from "./countRemovedBranches.ts";

export const countBranchChanges = (
    allBranches: IBranch[],
    filteredBranchIds: Set<string>,
    itemId: string,
    currentFilters: { responses: string[], situations: string[] },
    itemType: 'response' | 'situation'
): { added: number, removed: number, netChange: number } => {
    const added = countAdditionalBranches(
        allBranches,
        filteredBranchIds,
        itemId,
        currentFilters,
        itemType
    );

    const removed = countRemovedBranches(
        allBranches,
        filteredBranchIds,
        itemId,
        currentFilters,
        itemType
    );

    return {
        added,
        removed,
        netChange: added - removed
    };
};
