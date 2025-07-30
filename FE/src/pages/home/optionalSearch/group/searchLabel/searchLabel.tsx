import useStyles from "./searchLabel.css"
import {ILabel} from "../../../../../types/homepageType";
import {settingToResults} from "../../../../../store/shared/sharedSlice";
import { useSelector } from 'react-redux';
import { isAccessibilityActive } from "../../../../../store/general/general.selector";

const SearchLabel = ({value}:{value:ILabel}) => {
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({ accessibilityActive });
    const onClick = () => settingToResults({value, removeOldFilters:true})
    return <button
        className={classes.optionalSearchValue}
        onClick={onClick}>
        <span>{value.title}</span>
    </button>

}
export default SearchLabel;
