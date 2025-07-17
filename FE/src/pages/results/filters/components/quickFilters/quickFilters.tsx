import {useSelector} from "react-redux";
import useStyles from "./quickFilters.css";
import IFilterOptions from "../../../../../types/filterOptions";
import {getFilters} from "../../../../../store/filter/filter.selector";
import ResponseQuickFilter from "./responseQuickFilter";
import SituationQuickFilter from "./situationQuickFilter";
import {
    getQuickFilterResponseOptions,
    getQuickFilterSituationOptions
} from "../../../../../store/shared/quickFilter.selector";

const QuickFilters = () => {
    const classes = useStyles();
    const quickFilterText = window.strings.results.quickFilters;
    const responseOptions: IFilterOptions = useSelector(getQuickFilterResponseOptions)
    const situationOptions = useSelector(getQuickFilterSituationOptions);
    const filters: { responses: string[], situations: string[] } = useSelector(getFilters)
    return <div>
        <span className={classes.headerText}>{quickFilterText}</span>
        <div>
            {Object.entries(responseOptions).map(([id, value]) => (
                <ResponseQuickFilter key={id} value={value} id={id} responseFilters={filters.responses}/>))}
            {situationOptions.map(situation => (
                <SituationQuickFilter key={situation.id} value={{name: situation.name}} situationFilters={filters.situations} id={situation.id}/>
            ))}
        </div>
    </div>
}
export default QuickFilters;
