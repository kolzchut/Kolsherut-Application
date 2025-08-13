import useStyles from './QuickFiltersForMobile.css'
import IFilterOptions from "../../../../../types/filterOptions";
import {useSelector} from "react-redux";
import {getFilters} from "../../../../../store/filter/filter.selector";
import OccasionButtonForMobile from "./occasionButtonForMobile/occasionButtonForMobile";
import {getQuickFilterOptions,} from "../../../../../store/shared/quickFilter.selector";
import {Situation, Response} from "../../../../../types/cardType.ts";

const QuickFiltersForMobile = () => {
    const classes = useStyles();
    const filterOptions: IFilterOptions = useSelector(getQuickFilterOptions);
    const filters: { responses: string[], situations: string[] } = useSelector(getFilters);
    const filterOptionsArr = Object.entries(filterOptions);

    return <div className={classes.root}>
        {filterOptionsArr.map(([id, value]) => {
            const occasionData = {
                id,
                name: value.name,
                synonyms: []
            }
            const isResponse = value.type === 'response';
            const isSelected = (isResponse && filters.responses.includes(id)) || (!isResponse && filters.situations.includes(id));
            return <OccasionButtonForMobile
                isSelected={isSelected}
                key={value.name + id}
                count={value.count}
                {...(isResponse ? {response: occasionData as Response} : {situation: occasionData as Situation})}
            />
        })}

    </div>
}
export default QuickFiltersForMobile;
