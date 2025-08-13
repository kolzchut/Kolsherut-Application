import {IOrganization} from "../../../types/serviceType";
import useStyles from "./branchList.css";
import {store} from "../../../store/store";
import {setSelectedOrganization} from "../../../store/data/dataSlice";
import closeIcon from "../../../assets/icon-close-black.svg";
import Branch from "./branch/branch";
import {useDistanceFromTop} from "../context/contextFunctions";
import {useEffect, useRef} from "react";
import resultsAnalytics from "../../../services/gtag/resultsEvents";
import {useSelector} from "react-redux";
import {getSearchQuery} from "../../../store/general/general.selector";
import {getFilteredResponseLength} from "../../../store/shared/shared.selector";
import {isMobileScreen} from "../../../services/media.ts";
import IDynamicThemeApp from "../../../types/dynamicThemeApp.ts";
import {useTheme} from "react-jss";


const BranchList = ({organization}: { organization: IOrganization }) => {
    const distanceFromTop = useDistanceFromTop()
    const isMobile = isMobileScreen();
    const searchQuery = useSelector(getSearchQuery);
    const filtersCount = useSelector(getFilteredResponseLength);
    const responsesCount = useSelector(getFilteredResponseLength);
    const theme = useTheme<IDynamicThemeApp>();
    const classes = useStyles({distanceFromTop, isMobile, accessibilityActive: theme.accessibilityActive});
    const firstBranchRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        resultsAnalytics.viewItemListEvent({branches:organization.branches, organizationName:organization.name, searchQuery, filtersCount,responsesCount})

        // Focus on the first branch when the component mounts
        if (firstBranchRef.current) {
            firstBranchRef.current.focus();
        }
    }, [filtersCount, organization.branches, organization.name, responsesCount, searchQuery]);

    const onClose = () => store.dispatch(setSelectedOrganization(null));

    const handleCloseKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClose();
        }
    };

    return <div className={classes.mainDiv}>
        <div className={classes.title}>
            <span>{organization.name}</span>
            <img
                className={classes.closeIcon}
                src={closeIcon}
                onClick={onClose}
                onKeyDown={handleCloseKeyDown}
                tabIndex={0}
                role="button"
                aria-label="Close branch list"
                alt={"Close branch list"}
            />
        </div>
        <div className={classes.branchList}>
            {organization.branches?.map((branch, index) => (
                <Branch
                    key={branch.id}
                    branch={branch}
                    ref={index === 0 ? firstBranchRef : undefined}
                />
            )) || <div>No branches available</div>}
        </div>
    </div>
}
export default BranchList;
