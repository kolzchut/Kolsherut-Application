import {lazy, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    getSelectedOrganization
} from "../../store/data/data.selector";
import {addResultsPOIs, setMapOnLocation} from "./resultsLogic";
import useStyles from "./results.css";
import FiltersForDesktop from "./filters/filtersForDesktop";
import {setSelectedOrganization} from "../../store/data/dataSlice";
import Hits from "./hits/hits";
import {IService} from "../../types/serviceType";
import Header from "../../components/header/header";
import {
    getSearchQuery,
    getSelectedFeatureId,
    isAccessibilityActive,
    isLoading
} from "../../store/general/general.selector";
import {useDisplayResultsMap} from "./context/contextFunctions";
import {removeAllPOIs} from "../../services/map/poiInteraction";
import {
    getFilteredBranchesByResponseAndFilter,
    getFilteredResults,
} from "../../store/shared/shared.selector";
import resultsAnalytics from "../../services/gtag/resultsEvents";
import FiltersForMobile from "./filters/filtersForMobile";
import {getBackendFilters, getLocationFilter} from "../../store/filter/filter.selector";
import MetaTags from "../../services/metaTags";
import getResultsMetaTags from "./getResultsMetaTags";
import {useOnce} from "../../hooks/useOnce";
import {allowChangeStoreLocation} from "../../services/map/events/mapInteraction";
import { settingToResults} from "../../store/shared/sharedSlice";
import noResultsIcon from "../../assets/magnifyingGlass.svg";
import Loader from "./loader/loader";
import {isMobileScreen} from "../../services/media";
import BranchServicesForMobile from "./branchServicesForMobile/branchServicesForMobile";
import BranchList from "./branchList/branchList";
import {setPopupOffsetForBigMap, setPopupOffsetForSmallMap} from "../../services/map/events/popup";
import {ILabel} from "../../types/homepageType";
import mapService from "../../services/map/map";
import logger from "../../services/logger/logger";

const LazyMap = lazy(()=>import("../../components/map/map"));

const Results = () => {
    const [newPage, setNewPage] = useState(0);
    const isResultsLoading = useSelector(isLoading);
    const filteredResults = useSelector(getFilteredResults);
    const selectedOrganization = useSelector(getSelectedOrganization);
    const searchQuery = useSelector(getSearchQuery);
    const displayResultsMap = useDisplayResultsMap();
    const location = useSelector(getLocationFilter)
    const isMobile = isMobileScreen();
    const selectedFeatureId = useSelector(getSelectedFeatureId);
    const branchesForMapWithoutLocationFilter = useSelector(getFilteredBranchesByResponseAndFilter)
    const accessibilityActive = useSelector(isAccessibilityActive);
    const showBranchFilterForMobile = !!selectedFeatureId && isMobile && !selectedOrganization;
    const classes = useStyles({
        displayResultsMap,
        openSecondList: !!selectedOrganization || showBranchFilterForMobile,
        isMobile,
        accessibilityActive
    });
    const metaTagsData = getResultsMetaTags({searchQuery})
    const dispatch = useDispatch();
    const reportOnce = useOnce(() => resultsAnalytics.scrollOnceEvent());
    const refreshPage = () => setNewPage(prev => prev + 1);
    const newResults = () => {
        dispatch(setSelectedOrganization(null));
        removeAllPOIs();
        addResultsPOIs(branchesForMapWithoutLocationFilter);
        allowChangeStoreLocation(false);
        if (location.key !== window.strings.map.locationByBoundingBox)
            setMapOnLocation(location.bounds);
        allowChangeStoreLocation(true)

    }

    const conditionToShowResults = filteredResults.length > 0;
    const conditionToShowLoading = isResultsLoading && !conditionToShowResults;
    const conditionToShowNoResults = !isResultsLoading && filteredResults.length === 0;
    const backendFilters = useSelector(getBackendFilters)
    const finedSearchQuery = searchQuery.trim().replace(/_/g, ' ');
    useEffect(() => {
        newResults();
    }, [filteredResults]);
    useEffect(() => {
        if (selectedOrganization) return setPopupOffsetForSmallMap();
        return setPopupOffsetForBigMap();
    }, [selectedOrganization]);

    useEffect(() => {
        allowChangeStoreLocation(true)
        const value: ILabel = {query: searchQuery};
        if (backendFilters.situation) value.situation_id = backendFilters.situation;
        if (backendFilters.response) value.response_id = backendFilters.response;
        if (backendFilters.by) value.by = backendFilters.by;
        settingToResults({value});
        allowChangeStoreLocation(false);
        setMapOnLocation(location.bounds);
        allowChangeStoreLocation(true)
        return () => {
            allowChangeStoreLocation(false);
            removeAllPOIs();
            dispatch(setSelectedOrganization(null));
        }
    }, [newPage, searchQuery, backendFilters.situation, backendFilters.response, backendFilters.by]);
    useEffect(() => {
        if (displayResultsMap) {
            try {
                mapService.ol.updateSize();
            } catch (e) {
                logger.log({message:" map update size failed", payload: e});
            }
        }
    }, [displayResultsMap]);
    return <>
        <MetaTags {...metaTagsData}/>
        <div>
            <Header key={'resultHeader'} refreshPage={refreshPage}/>
            <div className={classes.mainDiv}>
                {isMobile ? <FiltersForMobile/> : <FiltersForDesktop/>}
                <div className={classes.resultsContainer} onScroll={reportOnce}>
                    <div className={classes.hits} onScroll={reportOnce}>
                        {conditionToShowResults && filteredResults.map((service: IService) => (
                            <Hits key={service.id} service={service}/>
                        ))}
                        {conditionToShowNoResults && (
                            <div className={classes.noResults}>
                                <img className={classes.noResultsIcon} src={noResultsIcon} alt={"no results"}/>
                                <span className={classes.noResultsTitle}>{window.strings.results.noResults}<span className={classes.noResultsSearchQuery}>{" "+finedSearchQuery}</span></span>
                                <span
                                    className={classes.noResultsSubtitle}>{window.strings.results.noResultsDescription}</span>
                            </div>
                        )}
                        {conditionToShowLoading && (<Loader/>)}
                    </div>
                    <div className={classes.branchList}>
                        {selectedOrganization && <BranchList organization={selectedOrganization}/>}
                        {showBranchFilterForMobile && (<BranchServicesForMobile featureId={selectedFeatureId}/>)}
                    </div>
                </div>
                <div className={classes.mapContainer}>
                    {displayResultsMap && <LazyMap />}
                </div>
            </div>
        </div>
    </>
}
export default Results;
