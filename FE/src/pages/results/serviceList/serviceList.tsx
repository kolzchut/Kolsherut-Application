import {IService} from "../../../types/serviceType";
import Hits from "../hits/hits";
import noResultsIcon from "../../../assets/magnifyingGlass.svg";
import Loader from "../loader/loader";
import {useSelector} from "react-redux";
import {
    getSearchQuery,
    getSelectedFeatureId,
    isAccessibilityActive,
    isLoading
} from "../../../store/general/general.selector";
import useStyles from "./serviceList.css";
import {useDisplayResultsMap} from "../context/contextFunctions";
import {getSelectedOrganization} from "../../../store/data/data.selector";
import {isMobileScreen} from "../../../services/media";
import {getFilteredResults} from "../../../store/shared/shared.selector";
import {useOnce} from "../../../hooks/useOnce";
import resultsAnalytics from "../../../services/gtag/resultsEvents";



const ServiceList = () => {
    const isResultsLoading = useSelector(isLoading);
    const displayResultsMap = useDisplayResultsMap();
    const selectedOrganization = useSelector(getSelectedOrganization);
    const isMobile = isMobileScreen();
    const selectedFeatureId = useSelector(getSelectedFeatureId);
    const accessibilityActive = useSelector(isAccessibilityActive);
    const filteredResults = useSelector(getFilteredResults);
    const searchQuery = useSelector(getSearchQuery);
    const reportOnce = useOnce(() => resultsAnalytics.scrollOnceEvent());

    const showBranchFilterForMobile = !!selectedFeatureId && isMobile && !selectedOrganization;

    const classes = useStyles({
        displayResultsMap,
        openSecondList: !!selectedOrganization || showBranchFilterForMobile,
        isMobile,
        accessibilityActive
    });
    const conditionToShowResults = filteredResults.length > 0;
    const conditionToShowLoading = isResultsLoading && !conditionToShowResults;
    const conditionToShowNoResults = !isResultsLoading && filteredResults.length === 0;
    const finedSearchQuery = searchQuery.trim().replace(/_/g, ' ');


    return  <div className={classes.hits} onScroll={reportOnce}>
        {conditionToShowResults && filteredResults.map((service: IService) => (
            <Hits key={service.id} service={service}/>
        ))}
        {conditionToShowNoResults && (
            <div className={classes.noResults}>
                <img className={classes.noResultsIcon} src={noResultsIcon} alt={"no results"}/>
                <span className={classes.noResultsTitle}>{window.strings.results.noResults}<span
                    className={classes.noResultsSearchQuery}>{" " + finedSearchQuery}</span></span>
                <span
                    className={classes.noResultsSubtitle}>{window.strings.results.noResultsDescription}</span>
            </div>
        )}
        {conditionToShowLoading && (<Loader/>)}
    </div>
};


export default ServiceList;
