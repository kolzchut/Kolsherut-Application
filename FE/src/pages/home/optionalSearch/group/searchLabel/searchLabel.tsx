import useStyles from "./searchLabel.css.ts"
import {ILabel} from "../../../../../types/homepageType.ts";
import {settingToResults} from "../../../../../store/shared/sharedSlice.ts";

const SearchLabel = ({value}:{value:ILabel}) => {
    const classes = useStyles();
    const onClick = () => settingToResults({value})
    return <button
        className={classes.optionalSearchValue}
        onClick={onClick}>
        <span>{value.title}</span>
    </button>

}
export default SearchLabel;
