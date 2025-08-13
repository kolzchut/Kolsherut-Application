import {useSelector} from "react-redux";
import useStyles from "./quickFilters.css";
import IFilterOptions from "../../../../../types/filterOptions";
import {getFilters} from "../../../../../store/filter/filter.selector";
import ResponseQuickFilter from "./responseQuickFilter";
import SituationQuickFilter from "./situationQuickFilter";
import {getQuickFilterOptions} from "../../../../../store/shared/quickFilter.selector";
import IDynamicThemeApp from "../../../../../types/dynamicThemeApp.ts";
import {useTheme} from "react-jss";

const QuickFilters = () => {
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({accessibilityActive: theme.accessibilityActive});
    const quickFilterText = window.strings.results.quickFilters;
    const responseOptions: IFilterOptions = useSelector(getQuickFilterOptions)
    const filters: { responses: string[], situations: string[] } = useSelector(getFilters)
    return <div>
        <span className={classes.headerText}>{quickFilterText}</span>
        <div>
            {Object.entries(responseOptions).map(([id, value]) => {
                const isResponse = value.type === 'response';
                if (isResponse) return (<ResponseQuickFilter key={id} value={value} id={id} responseFilters={filters.responses}/>);
                return (<SituationQuickFilter key={id} id={id} value={{name: value.name, count: value.count}}
                                              situationFilters={filters.situations}/>);

            })}
        </div>
    </div>
}
export default QuickFilters;
