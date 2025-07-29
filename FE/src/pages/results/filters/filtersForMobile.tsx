import useStyles from './filtersForMobile.css';
import MoreFilters from "./components/moreFilters/moreFilters";
import QuickFiltersForMobile from "./components/QuickFiltersForMobile/QuickFiltersForMobile";
import GeoFilterAndMapDisplayForMobile
    from "./components/geoFilterAndMapDisplayForMobile/geoFilterAndMapDisplayForMobile";

const FiltersForMobile = () => {
    const classes = useStyles();

    return <div className={classes.root}>
        <div className={classes.filtersContainer}>
        <MoreFilters/>
        <QuickFiltersForMobile/>
        </div>
        <GeoFilterAndMapDisplayForMobile/>
    </div>
}
export default FiltersForMobile;
