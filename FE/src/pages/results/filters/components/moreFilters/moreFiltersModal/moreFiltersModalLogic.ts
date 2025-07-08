import {store} from "../../../../../../store/store";
import {
    addSituationFilter,
    removeMultipleSituationFilters,
    removeSituationFilter
} from "../../../../../../store/filter/filterSlice";
import ISituationsToFilter from "../../../../../../types/SituationsToFilter";

export const onSituationClear = ({situations}:{situations: ISituationsToFilter[]}) => {
    const idsToRemove = situations.map(situation => situation.id);
    store.dispatch(removeMultipleSituationFilters(idsToRemove));
}

export const onSituationClick = ({situation}: { situation: ISituationsToFilter }) => {
    if (situation.selected) return store.dispatch(removeSituationFilter(situation.id))
    return store.dispatch(addSituationFilter(situation.id))
}
