import useStyles from './moreFilters.css';
import {store} from "../../../../../store/store";
import {setModal} from "../../../../../store/general/generalSlice";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../../../constants/mediaQueryProps";
import filtersIcon from '../../../../../assets/icon-filter-blue-1.svg';
import resultsAnalytics from "../../../../../services/gtag/resultsEvents.ts";

const MoreFilters = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyles({isMobile});
    const textForDesktop = window.strings.results.moreFilters;
    return <button className={classes.button} onClick={() => {
        resultsAnalytics.moreFiltersModalEvent();
        store.dispatch(setModal('MoreFiltersModal'))
    }}>
        {isMobile ? <img src={filtersIcon} alt={"filter icon"}/> : textForDesktop}
    </button>
}
export default MoreFilters;
