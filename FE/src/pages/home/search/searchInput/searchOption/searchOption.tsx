import AutocompleteType from "../../../../../types/autocompleteType";
import useStyles from "./searchOption.css";
import IconArrowTopRight from "../../../../../assets/icon-arrow-top-right-gray-4.svg";
import lightIconSearch from "../../../../../assets/icon-search-gray-4.svg";
import {settingToResults} from "../../../../../store/shared/sharedSlice";
import {ILabel} from "../../../../../types/homepageType";

const SearchOption = ({value, onCloseSearchOptions}: { value: AutocompleteType, onCloseSearchOptions: () => void }) => {
    const classes = useStyles();
    const onClick = () => {
        const customValueAsLabel: ILabel = {
            query: value.id,
            title: value.query,
            situation_id: value.situation || undefined,
            response_id: value.response || undefined,
        }
        settingToResults({value: customValueAsLabel});
        onCloseSearchOptions();
    };
    return <div onClick={onClick}
                className={classes.optionalSearchValue}>
                        <span className={classes.iconAndText}>
                            <img className={classes.searchIcon} alt={"חיפוש"} src={lightIconSearch}/>
                            {value.query}
                        </span>
        <img className={classes.searchIcon} alt={"חיפוש"} src={IconArrowTopRight}/>
    </div>
}
export default SearchOption;
