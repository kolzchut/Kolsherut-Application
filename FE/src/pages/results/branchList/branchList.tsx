import {IOrganization} from "../../../types/serviceType";
import useStyles from "./branchList.css";
import {store} from "../../../store/store";
import {setSelectedOrganization} from "../../../store/data/dataSlice";
import closeIcon from "../../../assets/icon-close-black.svg";
import Branch from "./branch/branch";
import {useDistanceFromTop} from "../context/contextFunctions";
import {useMediaQuery} from "@mui/material";
import {widthOfMobile} from "../../../constants/mediaQueryProps";
import {useEffect} from "react";
import {viewItemListEvent} from "../../../services/gtag/resultsEvents";
import {useSelector} from "react-redux";
import {getSearchQuery} from "../../../store/general/general.selector";
import {getFilteredResponseLength} from "../../../store/shared/shared.selector";


const BranchList = ({organization}: { organization: IOrganization }) => {
    const distanceFromTop = useDistanceFromTop()
    const isMobile = useMediaQuery(widthOfMobile);
    const searchQuery = useSelector(getSearchQuery);
    const filtersCount = useSelector(getFilteredResponseLength);
    const responsesCount = useSelector(getFilteredResponseLength);
    const classes = useStyles({distanceFromTop, isMobile});
    useEffect(() => {
        viewItemListEvent({branches:organization.branches, organizationName:organization.name, searchQuery, filtersCount,responsesCount})
    }, [filtersCount, organization.branches, organization.name, responsesCount, searchQuery]);
    const onClose = () => store.dispatch(setSelectedOrganization(null));
    return <div className={classes.mainDiv}>
        <div className={classes.title}>
            <span>{organization.name}</span>
            <img className={classes.closeIcon} src={closeIcon} onClick={onClose} alt={"Close branch list"}/>
        </div>
        <div className={classes.branchList}>
            {organization.branches.map(branch => (
                <Branch key={branch.id} branch={branch}/>
            ))}
        </div>
    </div>
}
export default BranchList;
