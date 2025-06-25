import {ICard} from "../../../../../types/cardType";
import useStyle from "./moreServicesInBranch.css";
import CardBanner from "../../../../../components/cardBanner/cardBanner";

const MoreServicesInBranch = ({moreServicesInBranch}: { moreServicesInBranch: ICard[] }) => {
    const moreServicesInBranchTitle = window.strings.cardDetails.moreServicesInBranchTitle;
    const classes = useStyle();
    return (
        <div className={classes.mainDiv}>
            <span className={classes.title}>{moreServicesInBranchTitle}</span>
            {moreServicesInBranch.map((service: ICard) => (<CardBanner card={service}/>))}
        </div>
    )
}
export default MoreServicesInBranch;