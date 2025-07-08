import {useSelector} from "react-redux";
import {getFilterResultsLength} from "../../../../../store/shared/shared.selector";
import {getLocationFilter} from "../../../../../store/filter/filter.selector";
import mapIcon from '../../../../../assets/icon-map-region-blue-2.svg';
import useStyles from "./geoFilter.css";
import {useSetShowGeoModal} from "../../../context/contextFunctions";

const GeoFilter = () => {
    const classes = useStyles();
    const resultsLength = useSelector(getFilterResultsLength)
    const location = useSelector(getLocationFilter)
    const setShowGeoFilter = useSetShowGeoModal()
    return <div className={classes.root} onClick={()=> setShowGeoFilter(true)}>
        <div className={classes.textAndMapDiv}>
            <img src={mapIcon} alt={"map"}/>
            <span>{location.key}</span>
        </div>
        <span className={classes.count}>{resultsLength}</span>
    </div>

}
export default GeoFilter;
