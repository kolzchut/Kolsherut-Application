import useStyles from "./searchLabel.css"
import {ILabel} from "../../../../../types/homepageType";
import {changingPageToResults} from "../../../../../store/shared/sharedSlice";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";

const SearchLabel = ({value}:{value:ILabel}) => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({ accessibilityActive: theme.accessibilityActive });
    const onClick = () => changingPageToResults({value, removeOldFilters:true})
    return <button
        className={classes.optionalSearchValue}
        onClick={onClick}>
        <span>{value.title}</span>
    </button>

}
export default SearchLabel;
