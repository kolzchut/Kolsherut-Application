import useStyles from './moreFilters.css';
import {useSetShowFiltersModal} from "../../../context/contextFunctions";
const MoreFilters = () =>{
    const classes = useStyles()
    const setShowFiltersModal = useSetShowFiltersModal();
    const text = window.strings.results.moreFilters
    return <button onClick={()=>setShowFiltersModal(true)} className={classes.button}>
        {text}
    </button>
}
export default MoreFilters;
