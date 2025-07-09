import useStyles from './moreFilters.css';
import {store} from "../../../../../store/store";
import {setModal} from "../../../../../store/general/generalSlice";
const MoreFilters = () =>{
    const classes = useStyles()
    const text = window.strings.results.moreFilters
    return <button onClick={()=>store.dispatch(setModal('MoreFiltersModal'))} className={classes.button}>
        {text}
    </button>
}
export default MoreFilters;
