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
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";
import {createKeyboardHandler} from "../../../../../services/keyboardHandler";

const SearchOption = ({value, onCloseSearchOptions, isStructured}: { value: IStructureAutocomplete | IUnStructuredAutocomplete, onCloseSearchOptions: () => void, isStructured:boolean}) => {
    const theme = useTheme<IDynamicThemeApp>();

    const classes = useStyles({ accessibilityActive: theme.accessibilityActive });
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

    const handleKeyDown = createKeyboardHandler(onClick);

    const icon = isStructured ? structuredSearchIcon : unstructuredSearchIcon;
    return <div onClick={onClick}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label={`Search option: ${value.label}`}
                className={classes.optionalSearchValue}>
                        <span className={classes.iconAndText}>
                            <img className={classes.searchIcon} alt={"חיפוש"} src={lightIconSearch}/>
                            {value.label}
                        </span>
        <img className={classes.searchIcon} alt={"חיפוש"} src={icon}/>
    </div>
}
export default SearchOption;
