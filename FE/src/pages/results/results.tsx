import {useState, useEffect} from "react";
import {useSelector} from "react-redux";
import {getResults, getSelectedOrganization} from "../../store/data/data.selector";
import {addResultsPOIs, getResultsFromServer} from "./resultsLogic";
import useStyles from "./results.css";
import Filters from "./filters/filters";
import {setResults as setResultsInStore} from "../../store/data/dataSlice";
import {store} from "../../store/store";
import Hits from "./hits/hits";
import {IService} from "../../types/serviceType";
import BranchList from "./branchList/branchList";
import Header from "../../components/header/header";
import {getSearchQuery} from "../../store/general/general.selector";
import Map from "../../components/map/map";
import {useDisplayResultsMap} from "./context/contextFunctions";

//TODO: get rid of this WTF!!!!!!!!!!


const Results = () => {

    const [results, setResults] = useState(useSelector(getResults));
    const selectedOrganization = useSelector(getSelectedOrganization);
    const searchQuery = useSelector(getSearchQuery);
    const displayResultsMap = useDisplayResultsMap();
    const classes = useStyles({displayResultsMap, isSelectedOrganization: !!selectedOrganization});
    useEffect(() => {
        const fetchResults = async () => {
            if (results.length === 0) {
                //TODO: replace
                const fetchedResults = await getResultsFromServer({serviceName: searchQuery});
                store.dispatch(setResultsInStore)
                setResults(fetchedResults);
            }
        };
        fetchResults();
        addResultsPOIs(results);
    }, [results]);
    return <div>
        <Header/>
        <div className={classes.mainDiv}>
            <Filters/>
            <div className={classes.resultsContainer}>
                <div className={classes.hits}>
                    {results.map((service: IService) => (
                        <Hits key={service.id} service={service}/>
                    ))}
                </div>
                <div className={classes.branchList}>
                    {selectedOrganization && (<BranchList organization={selectedOrganization}/>)}
                </div>
            </div>
            <div className={classes.mapContainer}>
                <Map/>
            </div>
        </div>
    </div>
}
export default Results;
