import useStyles from './filters.css';
import MapDisplay from "./components/mapDisplay/mapDisplay";

const Filters = () => {
    const classes = useStyles();
    return <div className={classes.root}>
        <h1>Filters</h1>
        <MapDisplay/>
    </div>
}
export default Filters;
