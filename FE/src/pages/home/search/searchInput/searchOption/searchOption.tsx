import {
    IStructureAutocomplete, IUnStructuredAutocomplete,
} from "../../../../../types/autocompleteType";
import useStyles from "./searchOption.css";
import structuredSearchIcon from "../../../../../assets/icon-arrow-top-right-gray-4.svg";
import lightIconSearch from "../../../../../assets/icon-search-gray-4.svg";
import unstructuredSearchIcon from "../../../../../assets/icon-chevron-left-gray-4.svg";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";
import {createKeyboardHandler} from "../../../../../services/keyboardHandler";
import splitEmSegments from "./utils/splitEmSegments";
import executeSearch from "../../../../../services/executeSearch.ts";

const SearchOption = ({value, onCloseSearchOptions, isStructured, refreshPage}: {
    value: IStructureAutocomplete | IUnStructuredAutocomplete,
    onCloseSearchOptions: () => void,
    isStructured: boolean
    refreshPage?: () => void
}) => {
    const theme = useTheme<IDynamicThemeApp>();

    const classes = useStyles({accessibilityActive: theme.accessibilityActive});

    const handleKeyDown = createKeyboardHandler(() => executeSearch({
        refreshPage,
        value,
        isStructured,
        onClose: onCloseSearchOptions
    }));

    const icon = isStructured ? structuredSearchIcon : unstructuredSearchIcon;
    const segments = value.labelHighlighted ? splitEmSegments(value.labelHighlighted) : null;

    return <div onClick={() => executeSearch({refreshPage, value, isStructured, onClose: onCloseSearchOptions})}
                onMouseDown={(e) => e.preventDefault()}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label={`Search option: ${value.label}`}
                className={classes.optionalSearchValue}>
                        <span className={classes.iconAndText}>
                            <img className={classes.searchIcon} alt={"חיפוש"} src={lightIconSearch}/>
                            {segments ? (
                                <span>
                                    {segments.map((seg, i) => seg.isEm ? (
                                        <span key={i}>{seg.text}</span>
                                    ) : (
                                        <span className={classes.boldText} key={i}>{seg.text}</span>
                                    ))}
                                </span>
                            ) : (
                                <span>{value.label}</span>
                            )}
                        </span>
        <img className={classes.searchIcon} alt={"חיפוש"} src={icon}/>
    </div>
}
export default SearchOption;
