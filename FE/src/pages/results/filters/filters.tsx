import useStyles from './filters.css';
import MapDisplay from "./components/mapDisplay/mapDisplay";
import QuickFilters from "./components/quickFilters/quickFilters";
import MoreFilters from "./components/moreFilters/moreFilters";

const Filters = () => {
    const classes = useStyles();
    return <div className={classes.root}>
        <h1>Filters</h1>
        <MapDisplay/>
        <QuickFilters/>
        <MoreFilters/>
    </div>
}
export default Filters;
