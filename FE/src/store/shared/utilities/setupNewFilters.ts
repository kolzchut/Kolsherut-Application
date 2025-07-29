import {IService} from "../../../types/serviceType.ts";
import {ILabel} from "../../../types/homepageType.ts";
import ILocation from "../../../types/locationType.ts";
import {getBranches} from "./getBranches.ts";

const setupNewFilters = ({results, value}: { results: IService[], value: ILabel }) => {
    const newFilters: { location?: ILocation, situations?: string[], responses?: string[] } = {};
    const allBranches = getBranches(results);
    if (value.situation_id) {
        const allSituationsIds = new Set(allBranches.flatMap(branch => branch.situations.map(situation => situation.id)));
        if (allSituationsIds.has(value.situation_id)) newFilters.situations = [value.situation_id];
    }
    if (value.response_id) {
    const allResponsesIds = new Set(allBranches.flatMap(branch => branch.responses.map(response => response.id)));
        if (allResponsesIds.has(value.response_id)) newFilters.responses = [value.response_id];
    }
    if (value.cityName && value.bounds) newFilters.location = {key: value.cityName, bounds: value.bounds};
    return newFilters;
}
export default setupNewFilters;
