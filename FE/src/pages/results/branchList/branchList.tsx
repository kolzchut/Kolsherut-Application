import {IOrganization} from "../../../types/serviceType";
import useStyles from "./branchList.css";
import {store} from "../../../store/store";
import {setSelectedOrganization} from "../../../store/data/dataSlice";
import closeIcon from "../../../assets/icon-close-black.svg";
import Branch from "./branch/branch";
import {useDistanceFromTop} from "../context/contextFunctions";

const BranchList = ({organization}: { organization: IOrganization }) => {
    const distanceFromTop = useDistanceFromTop()
    const onClose = () => store.dispatch(setSelectedOrganization(null));
    const classes = useStyles({distanceFromTop});
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
