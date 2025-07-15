import {useEffect} from "react";
import {useSelector} from "react-redux";
import {
    getSelectedOrganization
} from "../../store/data/data.selector";
import {addResultsPOIs, getResultsFromServer} from "./resultsLogic";
import useStyles from "./results.css";
import Filters from "./filters/filters";
import {setResults as setResultsInStore, setSelectedOrganization} from "../../store/data/dataSlice";
import {store} from "../../store/store";
import Hits from "./hits/hits";
import {IService} from "../../types/serviceType";
import BranchList from "./branchList/branchList";
import Header from "../../components/header/header";
import {getSearchQuery} from "../../store/general/general.selector";
import Map from "../../components/map/map";
import {
    useDisplayResultsMap,
} from "./context/contextFunctions";
import {removeAllPOIs} from "../../services/map/poiInteraction";
import {getFilteredBranches, getFilteredResponseLength, getFilteredResults} from "../../store/shared/shared.selector";
import { useMediaQuery } from '@mui/material';
import {widthOfMobile} from "../../constants/mediaQueryProps";
import {searchEvent} from "../../services/gtag/resultsEvents.ts";

const Results = () => {

    const filteredResults = useSelector(getFilteredResults);
    const selectedOrganization = useSelector(getSelectedOrganization);
    const branches = useSelector(getFilteredBranches);
    //TODO: change name to better one
    const searchQuery = useSelector(getSearchQuery);
    const filtersCount = useSelector(getFilteredResponseLength);
    const responseCount = useSelector(getFilteredResponseLength);
    const displayResultsMap = useDisplayResultsMap();
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyles({displayResultsMap, isSelectedOrganization: !!selectedOrganization, isMobile});

    const newResults = () => {
        store.dispatch(setSelectedOrganization(null));
        removeAllPOIs();
        addResultsPOIs(branches);
    }
    useEffect(() => {
        const fetchResults = async () => {
            if (filteredResults.length === 0) {
                //TODO: replace
                const fetchedResults = await getResultsFromServer({serviceName: searchQuery});
                store.dispatch(setResultsInStore(fetchedResults));
            }
        };
        fetchResults();
        newResults();
    }, [filteredResults, searchQuery]);
    useEffect(() => {
        searchEvent({searchQuery, responseCount,filtersCount});
    }, [searchQuery]);
    return <div>
        <Header/>
        <div className={classes.mainDiv}>
            <Filters/>
            <div className={classes.resultsContainer}>
                <div className={classes.hits}>
                    {filteredResults.map((service: IService) => (
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
