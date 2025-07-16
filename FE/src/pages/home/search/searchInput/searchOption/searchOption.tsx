import AutocompleteType from "../../../../../types/autocompleteType.ts";
import useStyles from "./searchOption.css";
import IconArrowTopRight from "../../../../../assets/icon-arrow-top-right-gray-4.svg";
import lightIconSearch from "../../../../../assets/icon-search-gray-4.svg";
import {settingToResults} from "../../../../../store/shared/sharedSlice.ts";
import {ILabel} from "../../../../../types/homepageType.ts";

const SearchOption = ({value}: { value: AutocompleteType }) => {
    const classes = useStyles();
    const onClick = () => {
        const customValueAsLabel: ILabel = {
            query: value.id,
            title: value.query,
            situation_id: value.situation || undefined,
            response_id: value.response || undefined,
        }
        settingToResults({value: customValueAsLabel})
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
