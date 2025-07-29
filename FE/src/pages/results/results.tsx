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
import {getSearchQuery, isLoading} from "../../store/general/general.selector";
import Map from "../../components/map/map";
import {useDisplayResultsMap} from "./context/contextFunctions";
import {removeAllPOIs} from "../../services/map/poiInteraction";
import {getFilteredBranches, getFilteredResults} from "../../store/shared/shared.selector";
import {useMediaQuery} from '@mui/material';
import {widthOfMobile} from "../../constants/mediaQueryProps";
import resultsAnalytics from "../../services/gtag/resultsEvents";
import FiltersForMobile from "./filters/filtersForMobile.tsx";
import {getLocationFilter} from "../../store/filter/filter.selector.ts";
import MetaTags from "../../services/metaTags.tsx";
import getResultsMetaTags from "./getResultsMetaTags.ts";
import {useOnce} from "../../hooks/useOnce";
import {allowChangeStoreLocation} from "../../services/map/events/mapInteraction.ts";
import {settingToResults} from "../../store/shared/sharedSlice.ts";
import noResultsIcon from "../../assets/noResults.svg";
import loadingIcon from '../../assets/searchAnimation.svg';

const Results = () => {
    const isResultsLoading = useSelector(isLoading);
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
    const reportOnce = useOnce(() => resultsAnalytics.scrollOnceEvent());
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
            settingToResults({value: {query: searchQuery}, removeOldFilters: false})
        }
        return () => {
            allowChangeStoreLocation(false);
            removeAllPOIs();
            dispatch(setSelectedOrganization(null));
        }
    }, []);
    const conditionToShowResults = filteredResults.length > 0;
    const conditionToShowLoading = isResultsLoading && !conditionToShowResults;
    const conditionToShowNoResults = !isResultsLoading && filteredResults.length === 0;
    return <>
        <MetaTags {...metaTagsData}/>
        <div>
            <Header/>
            <div className={classes.mainDiv}>
                {isMobile ? <FiltersForMobile/> : <FiltersForDesktop/>}
                <div className={classes.resultsContainer} onScroll={reportOnce}>
                    <div className={classes.hits}>
                        {conditionToShowResults&& filteredResults.map((service: IService) => (
                            <Hits key={service.id} service={service}/>
                        ))}
                        {conditionToShowNoResults&& (
                            <div className={classes.noResults}>
                                <img className={classes.noResultsIcon} src={noResultsIcon} alt={"no results"}/>
                                <span className={classes.noResultsTitle}>{window.strings.results.noResults}</span>
                                <span className={classes.noResultsSubtitle}>{window.strings.results.noResultsDescription}</span>
                            </div>
                        )}
                        {conditionToShowLoading && (
                            <div className={classes.loading}>
                                <img className={classes.loadingIcon} src={loadingIcon} alt={"loading..."} />
                            </div>
                        )}
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
