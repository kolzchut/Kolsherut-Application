import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    getSelectedOrganization
} from "../../store/data/data.selector";
import {addResultsPOIs, setMapOnLocation} from "./resultsLogic";
import useStyles from "./results.css";
import FiltersForDesktop from "./filters/filtersForDesktop.tsx";
import {setSelectedOrganization} from "../../store/data/dataSlice";
import Hits from "./hits/hits";
import {IService} from "../../types/serviceType";
import BranchList from "./branchList/branchList";
import Header from "../../components/header/header";
import {getSearchQuery} from "../../store/general/general.selector";
import Map from "../../components/map/map";
import {useDisplayResultsMap} from "./context/contextFunctions";
import {removeAllPOIs} from "../../services/map/poiInteraction";
import {getFilteredBranches, getFilteredResults} from "../../store/shared/shared.selector";
import {useMediaQuery} from '@mui/material';
import {widthOfMobile} from "../../constants/mediaQueryProps";
import {scrollOnceEvent} from "../../services/gtag/resultsEvents";
import FiltersForMobile from "./filters/filtersForMobile.tsx";
import {getLocationFilter} from "../../store/filter/filter.selector.ts";
import MetaTags from "../../services/metaTags.tsx";
import getResultsMetaTags from "./getResultsMetaTags.ts";
import {useOnce} from "../../hooks/useOnce";
import {allowChangeStoreLocation} from "../../services/map/events/mapInteraction.ts";
import {settingToResults} from "../../store/shared/sharedSlice.ts";


const Results = () => {

    const filteredResults = useSelector(getFilteredResults);
    const selectedOrganization = useSelector(getSelectedOrganization);
    const branches = useSelector(getFilteredBranches);
    //TODO: change name to better one
    const searchQuery = useSelector(getSearchQuery);
    const displayResultsMap = useDisplayResultsMap();
    const location = useSelector(getLocationFilter)
    const isMobile = useMediaQuery(widthOfMobile);
    const classes = useStyles({displayResultsMap, isSelectedOrganization: !!selectedOrganization, isMobile});
    const metaTagsData = getResultsMetaTags({searchQuery, location})
    const dispatch = useDispatch();
    const reportOnce = useOnce(() => scrollOnceEvent());
    const newResults = () => {
        dispatch(setSelectedOrganization(null));
        removeAllPOIs();
        addResultsPOIs(branches);
        allowChangeStoreLocation(false);
        if (location.key !== window.strings.map.locationByBoundingBox)
            setMapOnLocation(location.bounds);
        allowChangeStoreLocation(true)

    }
    useEffect(() => {
        newResults();
    }, [filteredResults, searchQuery]);
    useEffect(() => {
        allowChangeStoreLocation(true)
        if (!filteredResults || filteredResults.length === 0) {
            settingToResults({value: {title: searchQuery}, removeOldFilters: false})
        }
        return () => {
            allowChangeStoreLocation(false);
            removeAllPOIs();
            dispatch(setSelectedOrganization(null));
        }
    }, []);
    return <>
        <MetaTags {...metaTagsData}/>
        <div>
            <Header/>
            <div className={classes.mainDiv}>
                {isMobile ? <FiltersForMobile/> : <FiltersForDesktop/>}
                <div className={classes.resultsContainer} onScroll={reportOnce}>
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
    </>
}
export default Results;
