import useStyles from './QuickFiltersForMobile.css'
import IFilterOptions from "../../../../../types/filterOptions";
import {Response} from "../../../../../types/cardType";

import {useSelector} from "react-redux";
import {getFilters} from "../../../../../store/filter/filter.selector";
import ISituationsToFilter from "../../../../../types/SituationsToFilter";
import OccasionButtonForMobile from "./occasionButtonForMobile/occasionButtonForMobile";
import {
    getQuickFilterResponseOptions,
    getQuickFilterSituationOptions
} from "../../../../../store/shared/quickFilter.selector";

const QuickFiltersForMobile = () => {
    const classes = useStyles();
    const responseOptions: IFilterOptions = useSelector(getQuickFilterResponseOptions);
    const situationOptions: ISituationsToFilter[] = useSelector(getQuickFilterSituationOptions);
    const filters: { responses: string[], situations: string[] } = useSelector(getFilters);
    const responseOptionsArr = Object.entries(responseOptions);

    return <div className={classes.root}>
        {responseOptionsArr.map(([id, value]) => {
            const isSelected = filters.responses.includes(id);
            const response: Response = {
                id,
                name: value.name,
                synonyms:[]
            }
            if(!value.count) return;
            return <OccasionButtonForMobile isSelected={isSelected} key={value.name+id} response={response} count={value.count}/>
        })}
        {situationOptions.map((situation) => {
            const isSelected = filters.situations.includes(situation.id);
            return <OccasionButtonForMobile isSelected={isSelected} key={situation.name+situation.id} situation={situation}/>
        })}

    </div>
}
export default QuickFiltersForMobile;
