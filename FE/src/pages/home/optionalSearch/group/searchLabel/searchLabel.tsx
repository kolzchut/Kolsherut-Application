import useStyles from "./searchLabel.css"
import {ILabel} from "../../../../../types/homepageType";
import {changingPageToResults} from "../../../../../store/shared/sharedSlice";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";
import homepageAnalytics from "../../../../../services/gtag/homepageEvents.ts";

const SearchLabel = ({value}: { value: ILabel }) => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    const onClick = () => {
        changingPageToResults({value, removeOldFilters: true})
        homepageAnalytics.clickOnOptionalSearch({
            group: value.title || "",
            group_link: "",
            situation_id: value.situation_id || "",
            response_id: value.response_id || "",
            labels: []
        })

    }
    return <button
        className={classes.optionalSearchValue}
        onClick={onClick}>
        <span>{value.title}</span>
    </button>

}
export default SearchLabel;
