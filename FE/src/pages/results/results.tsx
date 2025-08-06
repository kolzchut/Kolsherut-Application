import {useEffect} from "react";
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
import Map from "../../components/map/map";
import {useDisplayResultsMap} from "./context/contextFunctions";
import {removeAllPOIs} from "../../services/map/poiInteraction";
import {
    getFilteredBranchesByResponseAndFilter,
    getFilteredResults,
} from "../../store/shared/shared.selector";
import resultsAnalytics from "../../services/gtag/resultsEvents";
import FiltersForMobile from "./filters/filtersForMobile";
import {getLocationFilter} from "../../store/filter/filter.selector";
import MetaTags from "../../services/metaTags";
import getResultsMetaTags from "./getResultsMetaTags";
import {useOnce} from "../../hooks/useOnce";
import {allowChangeStoreLocation} from "../../services/map/events/mapInteraction";
import {settingToResults} from "../../store/shared/sharedSlice";
import noResultsIcon from "../../assets/noResults.svg";
import Loader from "./loader/loader.tsx";
import {isMobileScreen} from "../../services/media.ts";
import BranchServicesForMobile from "./branchServicesForMobile/branchServicesForMobile.tsx";
import BranchList from "./branchList/branchList.tsx";
import { setPopupOffsetForBigMap, setPopupOffsetForSmallMap} from "../../services/map/events/popup.ts";

const Results = () => {
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
    const metaTagsData = getResultsMetaTags({searchQuery, location})
    const dispatch = useDispatch();
    const reportOnce = useOnce(() => resultsAnalytics.scrollOnceEvent());
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


    useEffect(() => {
        newResults();
    }, [filteredResults, searchQuery]);
    useEffect(() => {
        if(selectedOrganization) return setPopupOffsetForSmallMap();
        return setPopupOffsetForBigMap();
    }, [selectedOrganization]);

    useEffect(() => {
        allowChangeStoreLocation(true)
        if (!filteredResults || filteredResults.length === 0) {
            settingToResults({value: {query: searchQuery}, removeOldFilters: false})
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
            <Header key={'resultHeader'}/>
            <div className={classes.mainDiv}>
                {isMobile ? <FiltersForMobile/> : <FiltersForDesktop/>}
                <div className={classes.resultsContainer} onScroll={reportOnce}>
                    <div className={classes.hits}  onScroll={reportOnce}>
                        {conditionToShowResults && filteredResults.map((service: IService) => (
                            <Hits key={service.id} service={service}/>
                        ))}
                        {conditionToShowNoResults && (
                            <div className={classes.noResults}>
                                <img className={classes.noResultsIcon} src={noResultsIcon} alt={"no results"}/>
                                <span className={classes.noResultsTitle}>{window.strings.results.noResults}</span>
                                <span
                                    className={classes.noResultsSubtitle}>{window.strings.results.noResultsDescription}</span>
                            </div>
                        )}
                        {conditionToShowLoading && (<Loader/>)}
                    </div>
                    <div className={classes.branchList}>
                        {selectedOrganization && <BranchList organization={selectedOrganization}/>}
                        {showBranchFilterForMobile && (<BranchServicesForMobile featureId={selectedFeatureId} />)}
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
