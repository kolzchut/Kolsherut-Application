import useStyles from "./searchLabel.css"
import {ILabel} from "../../../../../types/homepageType";
import {changingPageToResults} from "../../../../../store/shared/sharedSlice";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp";
import homepageAnalytics from "../../../../../services/gtag/homepageEvents";
import buildUrlForSearchLabel from "./buildUrlForSearchLabel";

const SearchLabel = ({value}: { value: ILabel }) => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        changingPageToResults({value, removeOldFilters: true})
        homepageAnalytics.clickOnOptionalSearch({
            group: value.title || "",
            group_link: "",
            situation_id: value.situation_id || "",
            response_id: value.response_id || "",
            labels: []
        })

    }
    const href = buildUrlForSearchLabel({response: value.response_id, situation: value.situation_id, searchQuery:value.query});
    return <a href={href}
        className={classes.optionalSearchValue}
        onClick={onClick}>
        <span>{value.title}</span>
    </a>

}
export default SearchLabel;
