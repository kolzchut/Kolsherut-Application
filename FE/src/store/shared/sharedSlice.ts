import {ILabel} from "../../types/homepageType";
import {store} from "../store";
import {settingURLParamsToResults} from "../general/generalSlice";
import {setResponseAndSituationFilters} from "../filter/filterSlice.ts";

export const settingToResults = ({value}: { value: ILabel }) => {
    const situations = value.situation_id ? [value.situation_id] : [];
    const responses = value.response_id ?  [value.response_id] : [];
    store.dispatch(settingURLParamsToResults(value.query))
    store.dispatch(setResponseAndSituationFilters({situations, responses}))
} //TODO: ENHANCE THE LOGIC TO HANDLE MORE COMPLEX SCENARIOS
