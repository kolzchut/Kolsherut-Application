import useStyles from './filtersForDesktop.css';
import MapDisplay from "./components/mapDisplay/mapDisplay";
import QuickFilters from "./components/quickFilters/quickFilters";
import MoreFilters from "./components/moreFilters/moreFilters";
import GeoFilter from "./components/geoFilter/geoFilter";

const FiltersForDesktop = () => {
    const classes = useStyles();

    return <div className={classes.root}>
        <GeoFilter/>
        <MapDisplay/>
        <QuickFilters/>
        <MoreFilters/>
    </div>
}
export default FiltersForDesktop;
