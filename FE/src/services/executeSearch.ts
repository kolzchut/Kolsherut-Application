import {ILabel} from "../types/homepageType.ts";
import {IStructureAutocomplete, IUnStructuredAutocomplete} from "../types/autocompleteType.ts";
import {changingPageToResults, settingToCardAndFittingSearchQuery} from "../store/shared/sharedSlice.ts";
import generalAnalytics from "./gtag/generalEvents.ts";

interface IProps {
    value: IStructureAutocomplete | IUnStructuredAutocomplete,
    onClose: () => void,
    isStructured: boolean
    refreshPage?: () => void
}

const executeSearch = ({value, isStructured, onClose,refreshPage}:IProps) => {
    const customValueAsLabel: ILabel = {
        query: value.query,
        title: value.label,
        serviceName: value.serviceName
    }
    if (isStructured) {
        const structuredValue = value as IStructureAutocomplete;
        customValueAsLabel.situation_id = structuredValue.situationId;
        customValueAsLabel.response_id = structuredValue.responseId;
        customValueAsLabel.cityName = structuredValue.cityName;
        customValueAsLabel.bounds = structuredValue.bounds;
        customValueAsLabel.by = structuredValue.by;
        customValueAsLabel.serviceName = structuredValue.serviceName;
    } else {
        const unstructuredValue = value as IUnStructuredAutocomplete;
        if (unstructuredValue.cardId) {
            settingToCardAndFittingSearchQuery(value.query, unstructuredValue.cardId);
            generalAnalytics.enterCardFromSearchAutocomplete(unstructuredValue.cardId);
            onClose();
            return;
        }
    }
    generalAnalytics.searchFromSearchAutocomplete(value.query)
    changingPageToResults({value: customValueAsLabel, removeOldFilters: true, refreshPage});
    onClose();
};
export default executeSearch;
