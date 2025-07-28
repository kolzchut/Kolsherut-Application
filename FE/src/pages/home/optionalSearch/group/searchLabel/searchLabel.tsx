import useStyles from "./searchLabel.css"
import {ILabel} from "../../../../../types/homepageType";
import {settingToResults} from "../../../../../store/shared/sharedSlice";

const SearchLabel = ({value}:{value:ILabel}) => {
    const classes = useStyles();
    const onClick = () => settingToResults({value, removeOldFilters:true})
    return <button
        className={classes.optionalSearchValue}
        onClick={onClick}>
        <span>{value.title}</span>
    </button>

}
export default SearchLabel;
