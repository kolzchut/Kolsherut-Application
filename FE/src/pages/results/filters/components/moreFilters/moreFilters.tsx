import useStyles from './moreFilters.css';
import {store} from "../../../../../store/store";
import {setModal} from "../../../../../store/general/generalSlice";
import {isMobileScreen} from "../../../../../services/media.ts";
import filtersIcon from '../../../../../assets/icon-filter-blue-1.svg';
import resultsAnalytics from "../../../../../services/gtag/resultsEvents";
import { useSelector } from 'react-redux';
import {isAccessibilityActive} from "../../../../../store/general/general.selector.ts";

const MoreFilters = () => {
    const isMobile = isMobileScreen();
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({isMobile, accessibilityActive});
    const textForDesktop = window.strings.results.moreFilters;
    return <button className={classes.button} onClick={() => {
        resultsAnalytics.moreFiltersModalEvent();
        store.dispatch(setModal('MoreFiltersModal'))
    }}>
        {isMobile ? <img src={filtersIcon} alt={"filter icon"}/> : textForDesktop}
    </button>
}
export default MoreFilters;
