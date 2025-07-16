import useStyles from './filters.css';
import MapDisplay from "./components/mapDisplay/mapDisplay";
import QuickFilters from "./components/quickFilters/quickFilters";
import MoreFilters from "./components/moreFilters/moreFilters";
import GeoFilter from "./components/geoFilter/geoFilter";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../constants/mediaQueryProps";

const Filters = () => {
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyles({isMobile});

    return <div className={classes.root}>
        <GeoFilter/>
        <MapDisplay/>
        {!isMobile && <QuickFilters/>}
        <MoreFilters/>
    </div>
}
export default Filters;
