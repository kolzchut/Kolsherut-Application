import {getLinkToCard} from "../../../../services/str";
import nationalBranchIcon from "../../../../assets/icon-headset.svg";
import link from "../../../../assets/icon-arrow-top-right-gray-4.svg";
import useStyles from "./organization.css";
import {IBranch} from "../../../../types/serviceType";

const OrganizationWithSingleBranch = ({branch}: { branch: IBranch }) => {
    const classes = useStyles({isSelected: false});
    return <a href={getLinkToCard(branch.id)} className={classes.organization}>
                <span className={classes.nationalSpan}>
                    <span className={`${classes.text}`}>{branch.name}</span>
                    {branch.isNational && <span className={classes.nationalBranch}>/<img src={nationalBranchIcon} alt={"national branch icon"}/> {window.strings.results.nationalBranch}</span>}
            </span>
        <img src={link} alt={"Link to Branch"}/>
    </a>
}
export default OrganizationWithSingleBranch;
