import {useSelector} from "react-redux";
import {getFilterResultsLength} from "../../../../../store/shared/shared.selector";
import {getLocationFilter} from "../../../../../store/filter/filter.selector";
import mapIcon from '../../../../../assets/icon-map-region-blue-2.svg';
import useStyles from "./geoFilter.css";
import {store} from "../../../../../store/store";
import {setModal} from "../../../../../store/general/generalSlice";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../../../constants/mediaQueryProps.ts";

const GeoFilter = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyles({isMobile});
    const resultsLength = useSelector(getFilterResultsLength)
    const location = useSelector(getLocationFilter)
    return <div className={classes.root} onClick={()=> store.dispatch(setModal('GeoFilterModal'))}>
        <div className={classes.textAndMapDiv}>
            <img src={mapIcon} alt={"map"}/>
            <span>{location.key}</span>
        </div>
        <span className={classes.count}>{resultsLength}</span>
    </div>

}
export default GeoFilter;
