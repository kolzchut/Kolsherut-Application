import {
    IStructureAutocomplete, IUnStructuredAutocomplete,
} from "../../../../../types/autocompleteType";
import useStyles from "./searchOption.css";
import structuredSearchIcon from "../../../../../assets/icon-arrow-top-right-gray-4.svg";
import lightIconSearch from "../../../../../assets/icon-search-gray-4.svg";
import unstructuredSearchIcon from "../../../../../assets/icon-chevron-left-gray-4.svg";
import {settingToResults} from "../../../../../store/shared/sharedSlice";
import {ILabel} from "../../../../../types/homepageType";
import generalAnalytics from "../../../../../services/gtag/generalEvents";
import { useSelector } from 'react-redux';
import { isAccessibilityActive } from "../../../../../store/general/general.selector";

const SearchOption = ({value, onCloseSearchOptions, isStructured}: { value: IStructureAutocomplete | IUnStructuredAutocomplete, onCloseSearchOptions: () => void, isStructured:boolean}) => {
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({ accessibilityActive });
    const onClick = () => {
        const customValueAsLabel: ILabel = {
            query: value.query,
            title: value.label,
        }
        if(isStructured) {
            const structuredValue = value as IStructureAutocomplete;
            customValueAsLabel.situation_id = structuredValue.situationId;
            customValueAsLabel.response_id = structuredValue.responseId;
            customValueAsLabel.cityName = structuredValue.cityName;
            customValueAsLabel.bounds = structuredValue.bounds;
        }
        generalAnalytics.enterServiceFromSearchAutocomplete(value.query)
        settingToResults({value: customValueAsLabel, removeOldFilters:true});
        onCloseSearchOptions();
    };
    const icon = isStructured ? structuredSearchIcon : unstructuredSearchIcon;
    return <div onClick={onClick}
                className={classes.optionalSearchValue}>
                        <span className={classes.iconAndText}>
                            <img className={classes.searchIcon} alt={"חיפוש"} src={lightIconSearch}/>
                            {value.label}
                        </span>
        <img className={classes.searchIcon} alt={"חיפוש"} src={icon}/>
    </div>
}
export default SearchOption;
