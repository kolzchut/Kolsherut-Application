import useStyles from './geoFilterAndMapDisplayForMobile.css'
import israelLocation from "../../../../../constants/israelLocation";
import {useSelector} from "react-redux";
import {getLocationFilter} from "../../../../../store/filter/filter.selector";
import {getFilterResultsLength} from "../../../../../store/shared/shared.selector";
import mapIcon from "../../../../../assets/icon-map-region-blue-2.svg";
import nationWideIcon from "../../../../../assets/wideLocation.svg";
import searchLocationIcon from "../../../../../assets/icon-search-blue-1.svg"
import {store} from "../../../../../store/store";
import {setLocationFilter} from "../../../../../store/filter/filterSlice";
import {useDisplayResultsMap, useSetDisplayResultsMap} from "../../../context/contextFunctions";
import {setModal} from "../../../../../store/general/generalSlice";

const GeoFilterAndMapDisplayForMobile = () => {
    const currentLocation = useSelector(getLocationFilter);
    const resultsLength = useSelector(getFilterResultsLength);
    const onClickNationWide = () => store.dispatch(setLocationFilter(israelLocation))
    const nationwideKey = israelLocation.key;
    const isNationwide = currentLocation.key === nationwideKey;
    const displayResultsMap = useDisplayResultsMap()
    const setDisplayResultsMap = useSetDisplayResultsMap()
    const classes = useStyles({isNationwide, displayResultsMap, isSearchOpen:!isNationwide});
    const displayMapText = displayResultsMap ? window.strings.results.hideMapOnMobile : window.strings.results.showMapOnMobile;
    const searchText = isNationwide ? window.strings.results.searchLocationOnMobile : currentLocation.key;
    return <div className={classes.root}>
        <button className={classes.nationwideButton} onClick={onClickNationWide}>
            <div className={classes.textAndMapDiv}>
                <img src={nationWideIcon} alt={"all country icon"}/>
                {isNationwide && <span>{nationwideKey}</span>}
            </div>
            {isNationwide && <span className={classes.count}>{resultsLength}</span>}
        </button>
        <button className={`${classes.mapButton} ${classes.textAndMapDiv}`}
                onClick={() => setDisplayResultsMap(!displayResultsMap)}>
            <img src={mapIcon} alt={"map icon"}/>
            {isNationwide && <span>{displayMapText}</span>}
        </button>
        <button className={`${classes.searchButton} ${classes.textAndMapDiv}`} onClick={()=> store.dispatch(setModal('GeoFilterModal'))}>
                <img src={searchLocationIcon} alt={"search icon"}/>
                <span>{searchText}</span>
            {!isNationwide && <span className={classes.count}>{resultsLength}</span>}
        </button>
    </div>
}

export default GeoFilterAndMapDisplayForMobile;
