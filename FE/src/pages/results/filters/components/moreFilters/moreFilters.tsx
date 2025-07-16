import useStyles from './moreFilters.css';
import {store} from "../../../../../store/store";
import {setModal} from "../../../../../store/general/generalSlice";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../../../constants/mediaQueryProps";
const MoreFilters = () =>{
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyles({isMobile});
    const text = isMobile ? window.strings.results.moreFiltersForMobile : window.strings.results.moreFilters
    return <button onClick={()=>store.dispatch(setModal('MoreFiltersModal'))} className={classes.button}>
        {text}
    </button>
}
export default MoreFilters;
