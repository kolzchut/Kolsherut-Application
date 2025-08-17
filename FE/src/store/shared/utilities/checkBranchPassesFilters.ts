import {checkTags} from "./checkTags.ts";
import {IBranch} from "../../../types/serviceType.ts";

export const checkBranchPassesFilters = (
    branch: IBranch,
    responseFilters: string[],
    situationFilters: string[]
): boolean => {
    const branchResponseIds = branch.responses.map(r => r.id);
    const branchSituationIds = branch.situations.map(s => s.id);

    const passesResponseFilters = checkTags({
        filters: responseFilters,
        ids: branchResponseIds,
        checkAll: !(responseFilters.length > 1)
    });

    if (!passesResponseFilters) return false;

    if (situationFilters.length > 0) {
        const passesSituationFilters = checkTags({
            filters: situationFilters,
            ids: branchSituationIds,
            checkAll:  !(situationFilters.length > 1)
        });
        if (!passesSituationFilters) return false;
    }

    return true;
};
