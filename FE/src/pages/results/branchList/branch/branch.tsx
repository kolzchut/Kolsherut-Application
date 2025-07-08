import useStyles from "./branch.css";
import {IBranch} from "../../../../types/serviceType";
import nationalIcon from "../../../../assets/icon-headset.svg";
import linkIcon from "../../../../assets/icon-arrow-top-right-gray-4.svg";
import {getLinkToCard} from "../../../../services/str";

const Branch = ({branch}: { branch: IBranch }) => {
    const classes = useStyles()
    const accurateLocation: string = branch.isAccurate ? "" : window.strings.results.notAccurateLocation;
    const addressText: string = branch.address + " " + accurateLocation;
    const showNational = branch.isNational && !branch.address
    const cardLink = getLinkToCard(branch.id)

    return <a href={cardLink} className={classes.mainDiv}>
        <div className={classes.textDiv}>
            {branch.name && <span className={classes.branchName}>{branch.name}</span>}
            {branch.address && <span className={classes.branchAddress}>{addressText} </span>}
            {showNational && <span className={classes.nationalBranch}>{window.strings.results.nationalBranch}</span>}
        </div>
        <div>
            {showNational && <img src={nationalIcon} alt={"national icon"} className={classes.icon}/>}
            <img src={linkIcon} alt={"link icon"} className={classes.icon}/>
        </div>
    </a>
}
export default Branch;
