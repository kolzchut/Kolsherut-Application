import {lazy, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {getSelectedOrganization} from "../../store/data/data.selector";
import {setMapOnLocation} from "./resultsLogic";
import useStyles from "./results.css";
import FiltersForDesktop from "./filters/filtersForDesktop";
import {setSelectedOrganization} from "../../store/data/dataSlice";
import Header from "../../components/header/header";
import {getSearchQuery, getSelectedFeatureId} from "../../store/general/general.selector";
import {useDisplayResultsMap} from "./context/contextFunctions";
import {removeAllPOIs} from "../../services/map/poiInteraction";
import {getFilteredBranchesByResponseAndFilter, getFilteredResults} from "../../store/shared/shared.selector";
import resultsAnalytics from "../../services/gtag/resultsEvents";
import FiltersForMobile from "./filters/filtersForMobile";
import {getBackendFilters, getLocationFilter} from "../../store/filter/filter.selector";
import MetaTags from "../../services/metaTags";
import getResultsMetaTags from "./getResultsMetaTags";
import {useOnce} from "../../hooks/useOnce";
import {allowChangeStoreLocation} from "../../services/map/events/mapInteraction";
import {settingToResults} from "../../store/shared/sharedSlice";
import {isMobileScreen} from "../../services/media";
import BranchServicesForMobile from "./branchServicesForMobile/branchServicesForMobile";
import BranchList from "./branchList/branchList";
import {setPopupOffsetForBigMap, setPopupOffsetForSmallMap} from "../../services/map/events/popup";
import mapService from "../../services/map/map";
import logger from "../../services/logger/logger";
import ServiceList from "./serviceList/serviceList";
import {convertFilterToBeFormat, updatePois} from "./utils";
import {useGetCurrentRoute} from "../../services/url/route";

const LazyMap = lazy(() => import("../../components/map/map"));

const Results = () => {
    const [newPage, setNewPage] = useState(0);
    const filteredResults = useSelector(getFilteredResults);
    const selectedOrganization = useSelector(getSelectedOrganization);
    const searchQuery = useSelector(getSearchQuery);
    const displayResultsMap = useDisplayResultsMap();
    const location = useSelector(getLocationFilter)
    const isMobile = isMobileScreen();
    const selectedFeatureId = useSelector(getSelectedFeatureId);
    const branchesForMapWithoutLocationFilter = useSelector(getFilteredBranchesByResponseAndFilter)
    const backendFilters = useSelector(getBackendFilters)
    const showBranchFilterForMobile = !!selectedFeatureId && isMobile && !selectedOrganization;
    const pageUrl = useGetCurrentRoute();
    const classes = useStyles({
        displayResultsMap, isMobile,
        openSecondList: !!selectedOrganization || showBranchFilterForMobile,
    });
    const metaTagsData = getResultsMetaTags({searchQuery, locationFilter: location.key, backendFilters, pageUrl})
    const dispatch = useDispatch();
    const reportOnce = useOnce(() => resultsAnalytics.scrollOnceEvent());
    const refreshPage = () => setNewPage(prev => prev + 1);
    const updateResults = () => {
        dispatch(setSelectedOrganization(null));
        updatePois({location, branchesForMapWithoutLocationFilter});
    }

    useEffect(() => {
        updateResults();
    }, [filteredResults]);

    useEffect(() => {
        if (selectedOrganization) return setPopupOffsetForSmallMap();
        return setPopupOffsetForBigMap();
    }, [selectedOrganization]);

    useEffect(() => {
        allowChangeStoreLocation(true)
        const beFilter = convertFilterToBeFormat({searchQuery, backendFilters});
        settingToResults(beFilter);
        allowChangeStoreLocation(false);
        setMapOnLocation(location.bounds);
        allowChangeStoreLocation(true)
        return () => {
            allowChangeStoreLocation(false);
            removeAllPOIs();
            dispatch(setSelectedOrganization(null));
        }
    }, [newPage, searchQuery, backendFilters.situation, backendFilters.response, backendFilters.by, backendFilters.serviceName]);

    useEffect(() => {
        if (!displayResultsMap) return;
        try {
            mapService.ol.updateSize();
        } catch (e) {
            logger.log({message: " map update size failed", payload: e});
        }
    }, [displayResultsMap]);

    return <>
        <MetaTags {...metaTagsData}/>
        <main>
            <Header key={'resultHeader'} refreshPage={refreshPage}/>
            <div className={classes.mainDiv}>
                {isMobile ? <FiltersForMobile/> : <FiltersForDesktop/>}
                <div className={classes.resultsContainer} onScroll={reportOnce}>
                    <ServiceList/>
                    <div className={classes.branchList}>
                        {selectedOrganization && <BranchList organization={selectedOrganization}/>}
                        {showBranchFilterForMobile && (<BranchServicesForMobile featureId={selectedFeatureId}/>)}
                    </div>
                </div>
                <div className={classes.mapContainer}>
                    <LazyMap/>
                </div>
            </div>
        </main>
    </>
}
export default Results;
