import nationalBranchIcon from "../../../../assets/icon-headset.svg";
import link from "../../../../assets/icon-arrow-top-right-gray-4.svg";
import useStyles from "./organizationWithSingleBranch.css";
import {IBranch} from "../../../../types/serviceType";
import {getHrefForCard} from "../../../../services/href";
import {reRouteToCard} from "../../../../services/routes/reRoute";
import { useSelector } from 'react-redux';
import {isAccessibilityActive} from "../../../../store/general/general.selector.ts";

const OrganizationWithSingleBranch = ({branch, orgName}: { branch: IBranch, orgName: string }) => {
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({accessibilityActive});
    const href = getHrefForCard(branch.id);
    const name = branch.isNational ? orgName : branch.name || branch.address;
    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        reRouteToCard({cardId: branch.id})
    }
    return <a onClick={onClick} href={href} className={classes.organization}>
                <span className={classes.nationalSpan}>
                    <span className={`${classes.text}`}>{name}</span>
                    {branch.isNational && <span className={classes.nationalBranch}>/<img src={nationalBranchIcon}
                                                                                         alt={"national branch icon"}/> {window.strings.results.nationalBranch}</span>}
            </span>
        <img src={link} alt={"Link to Branch"}/>
    </a>
}
export default OrganizationWithSingleBranch;
